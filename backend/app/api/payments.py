from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import hmac
import hashlib
from app.database import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.config import settings

router = APIRouter(prefix="/payments", tags=["payments"])


class CreateOrderRequest(BaseModel):
    plan: str  # pro | business


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


PLAN_PRICES = {
    "pro": 49900,      # ₹499 in paise
    "business": 199900,  # ₹1999 in paise
}

PLAN_CREDITS = {
    "pro": 9999,       # "unlimited"
    "business": 9999,
}


@router.post("/create-order")
async def create_order(
    body: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        import razorpay
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        amount = PLAN_PRICES.get(body.plan)
        if not amount:
            raise HTTPException(status_code=400, detail="Invalid plan")

        order = client.order.create({
            "amount": amount,
            "currency": "INR",
            "notes": {"plan": body.plan, "user_id": str(current_user.id)},
        })
        return {"razorpay_order_id": order["id"], "amount": amount, "currency": "INR"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify")
async def verify_payment(
    body: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify HMAC-SHA256 signature
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if expected != body.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Determine plan from order (store in notes during create-order; here we detect from amount)
    # For MVP: just upgrade to pro
    current_user.plan = "pro"
    current_user.credits = PLAN_CREDITS["pro"]
    await db.flush()

    return {"success": True, "plan": current_user.plan}


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body_bytes = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    # Verify webhook signature
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        body_bytes,
        hashlib.sha256,
    ).hexdigest()

    if expected != signature:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    import json
    payload = json.loads(body_bytes)
    event = payload.get("event")

    if event == "subscription.charged":
        sub_id = payload["payload"]["subscription"]["entity"]["id"]
        result = await db.execute(select(User).where(User.razorpay_sub_id == sub_id))
        user = result.scalar_one_or_none()
        if user:
            user.credits = 9999  # Reset for pro
            await db.flush()

    return {"status": "ok"}
