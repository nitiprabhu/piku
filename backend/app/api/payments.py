from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import hmac
import hashlib
import json
import logging
from app.database import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])


class CreateOrderRequest(BaseModel):
    plan: str  # starter | pro | business


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: Optional[str] = None
    razorpay_subscription_id: Optional[str] = None
    razorpay_signature: str


PLAN_PRICES = {
    "starter": 9900,     # ₹99 one-time in paise
    "pro": 49900,        # ₹499/mo in paise
    "business": 399900,  # ₹3,999/mo in paise
}

PLAN_CREDITS = {
    "starter": 10,
    "pro": 60,
    "business": 100,
}

OVERAGE_PRICE_PAISE = {
    "pro": 800,
    "business": 1500,
}

FIRST_VIDEO_PRICE_PAISE = 2900  # ₹29 one-time

PLAN_RANK = {"free": 0, "starter": 1, "pro": 2, "business": 3}


def _razorpay_client():
    import razorpay
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


@router.post("/first-video-order")
async def first_video_order(
    current_user: User = Depends(get_current_user),
):
    if current_user.first_video_purchased:
        raise HTTPException(status_code=400, detail="First video offer already used")
    try:
        client = _razorpay_client()
        order = client.order.create({
            "amount": FIRST_VIDEO_PRICE_PAISE,
            "currency": "INR",
            "notes": {"plan": "first_video", "user_id": str(current_user.id)},
        })
        return {"razorpay_order_id": order["id"], "amount": FIRST_VIDEO_PRICE_PAISE, "currency": "INR", "type": "order"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-order")
async def create_order(
    body: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
):
    if body.plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")

    try:
        client = _razorpay_client()

        # Pro/Business: use Razorpay Subscription for monthly recurring billing
        # Falls back to one-time order if plan IDs not configured in env
        plan_id_map = {
            "pro": settings.RAZORPAY_PLAN_ID_PRO,
            "business": settings.RAZORPAY_PLAN_ID_BUSINESS,
        }
        razorpay_plan_id = plan_id_map.get(body.plan, "")

        if body.plan in ("pro", "business") and razorpay_plan_id:
            sub = client.subscription.create({
                "plan_id": razorpay_plan_id,
                "quantity": 1,
                "total_count": 12,
                "notes": {"plan": body.plan, "user_id": str(current_user.id)},
            })
            return {
                "razorpay_sub_id": sub["id"],
                "amount": PLAN_PRICES[body.plan],
                "currency": "INR",
                "type": "subscription",
            }

        # Starter or monthly plans without subscription plan IDs configured
        order = client.order.create({
            "amount": PLAN_PRICES[body.plan],
            "currency": "INR",
            "notes": {"plan": body.plan, "user_id": str(current_user.id)},
        })
        return {"razorpay_order_id": order["id"], "amount": PLAN_PRICES[body.plan], "currency": "INR", "type": "order"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify")
async def verify_payment(
    body: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Idempotency: same payment already processed
    if (
        body.razorpay_payment_id
        and current_user.razorpay_last_payment_id == body.razorpay_payment_id
    ):
        return {"success": True, "plan": current_user.plan, "credits": current_user.credits}

    is_subscription = bool(body.razorpay_subscription_id)

    if is_subscription:
        # Subscription signature: HMAC-SHA256(payment_id + "|" + subscription_id)
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            f"{body.razorpay_payment_id}|{body.razorpay_subscription_id}".encode(),
            hashlib.sha256,
        ).hexdigest()
    else:
        # Order signature: HMAC-SHA256(order_id + "|" + payment_id)
        if not body.razorpay_order_id:
            raise HTTPException(status_code=400, detail="razorpay_order_id required for order payments")
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()

    if expected != body.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Determine plan
    client = _razorpay_client()
    plan = "pro"
    try:
        if is_subscription:
            sub = client.subscription.fetch(body.razorpay_subscription_id)
            plan = sub.get("notes", {}).get("plan", "pro")
            current_user.razorpay_sub_id = body.razorpay_subscription_id
        else:
            order = client.order.fetch(body.razorpay_order_id)
            plan = order.get("notes", {}).get("plan", "pro")
    except Exception:
        logger.warning("Failed to fetch Razorpay order/subscription for plan detection; defaulting to 'pro'")

    # Apply credits
    if plan == "first_video":
        if current_user.first_video_purchased:
            raise HTTPException(status_code=400, detail="First video offer already used")
        current_user.first_video_purchased = True
        current_user.credits = (current_user.credits or 0) + 1
    elif plan in PLAN_CREDITS:
        # Only upgrade plan tier, never downgrade
        if PLAN_RANK.get(plan, 0) > PLAN_RANK.get(current_user.plan or "free", 0):
            current_user.plan = plan
        current_user.credits = (current_user.credits or 0) + PLAN_CREDITS[plan]

    current_user.razorpay_last_payment_id = body.razorpay_payment_id
    logger.info("Payment verified: user=%s plan=%s payment=%s", current_user.id, plan, body.razorpay_payment_id)

    return {"success": True, "plan": current_user.plan, "credits": current_user.credits}


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body_bytes = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        body_bytes,
        hashlib.sha256,
    ).hexdigest()

    if expected != signature:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    payload = json.loads(body_bytes)
    event = payload.get("event")
    logger.info("Razorpay webhook: event=%s", event)

    if event == "subscription.charged":
        sub_id = payload["payload"]["subscription"]["entity"]["id"]
        payment_id = payload["payload"]["payment"]["entity"]["id"]
        result = await db.execute(select(User).where(User.razorpay_sub_id == sub_id))
        user = result.scalar_one_or_none()
        if not user:
            logger.warning("subscription.charged: no user found for sub_id=%s", sub_id)
            return {"status": "ok"}

        # Idempotency
        if user.razorpay_last_payment_id == payment_id:
            return {"status": "ok"}

        plan = user.plan or "pro"
        user.credits = (user.credits or 0) + PLAN_CREDITS.get(plan, 60)
        user.razorpay_last_payment_id = payment_id
        logger.info("subscription.charged: user=%s plan=%s +%d credits", user.id, plan, PLAN_CREDITS.get(plan, 60))

    elif event == "payment.captured":
        # Backup handler: credits user if frontend verify never called (browser crash etc.)
        entity = payload["payload"]["payment"]["entity"]
        payment_id = entity.get("id")
        order_id = entity.get("order_id")
        if not order_id:
            return {"status": "ok"}

        try:
            client = _razorpay_client()
            order = client.order.fetch(order_id)
            notes = order.get("notes", {})
            plan = notes.get("plan", "")
            user_id = notes.get("user_id", "")
        except Exception:
            logger.warning("payment.captured: failed to fetch order %s", order_id)
            return {"status": "ok"}

        if not plan or not user_id:
            return {"status": "ok"}

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return {"status": "ok"}

        # Skip if already credited (frontend verify already ran)
        if user.razorpay_last_payment_id == payment_id:
            return {"status": "ok"}

        if plan == "first_video":
            if not user.first_video_purchased:
                user.first_video_purchased = True
                user.credits = (user.credits or 0) + 1
        elif plan == "starter":
            user.plan = "starter"
            user.credits = (user.credits or 0) + PLAN_CREDITS["starter"]
        elif plan in PLAN_CREDITS:
            if PLAN_RANK.get(plan, 0) > PLAN_RANK.get(user.plan or "free", 0):
                user.plan = plan
            user.credits = (user.credits or 0) + PLAN_CREDITS[plan]

        user.razorpay_last_payment_id = payment_id
        logger.info("payment.captured (backup): user=%s plan=%s payment=%s", user.id, plan, payment_id)

    return {"status": "ok"}
