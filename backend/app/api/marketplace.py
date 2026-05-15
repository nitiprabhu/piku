"""
Marketplace API — /api/v1/marketplace/

Profiles
  GET/PUT  /marketplace/creator/profile          — my creator profile
  GET/PUT  /marketplace/brand/profile            — my brand profile

Creator discovery (public)
  GET      /marketplace/creators                 — search creators
  GET      /marketplace/creators/{user_id}       — public creator card

Briefs
  GET      /marketplace/briefs                   — list open briefs (creator browse)
  POST     /marketplace/briefs                   — brand creates brief
  GET      /marketplace/briefs/{brief_id}        — brief detail
  PATCH    /marketplace/briefs/{brief_id}        — brand updates/closes brief
  GET      /marketplace/brand/briefs             — my briefs (brand)

Deal requests
  POST     /marketplace/briefs/{brief_id}/apply  — creator applies
  POST     /marketplace/briefs/{brief_id}/invite — brand invites creator
  PATCH    /marketplace/requests/{request_id}    — accept / reject / negotiate

Deals
  GET      /marketplace/deals                    — my deals (both sides)
  GET      /marketplace/deals/{deal_id}          — deal detail
  PATCH    /marketplace/deals/{deal_id}/status   — update deal status
  POST     /marketplace/deals/{deal_id}/messages — send message
  GET      /marketplace/deals/{deal_id}/messages — get conversation
  POST     /marketplace/deals/{deal_id}/deliver  — creator submits deliverable
  PATCH    /marketplace/deliverables/{deliv_id}  — brand approves/requests revision
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.marketplace import (
    CreatorProfile, BrandProfile, Brief, DealRequest, Deal, DealMessage, DealDeliverable,
)

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

PLATFORM_FEE = 0.12   # 12% total fee
RAZORPAY_FEE = 0.02   # 2% payment processing
CREATOR_TAKE  = 1 - PLATFORM_FEE - RAZORPAY_FEE  # 86%


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class CreatorProfileIn(BaseModel):
    bio: Optional[str] = None
    niches: Optional[list[str]] = None
    languages: Optional[list[str]] = None
    rate_per_reel: Optional[int] = None  # paise
    portfolio_urls: Optional[list[str]] = None
    instagram_handle: Optional[str] = None
    youtube_handle: Optional[str] = None
    follower_count: Optional[int] = None

class BrandProfileIn(BaseModel):
    company_name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    gstin: Optional[str] = None
    logo_url: Optional[str] = None

class BriefIn(BaseModel):
    title: str
    description: Optional[str] = None
    niches: Optional[list[str]] = None
    languages: Optional[list[str]] = None
    num_reels: int = Field(ge=1)
    budget_per_reel: int = Field(ge=100)  # paise, min ₹1
    timeline_days: int = Field(ge=1)
    requirements: Optional[dict] = None

class BriefPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # open | closed | paused

class ApplyIn(BaseModel):
    message: Optional[str] = None
    proposed_rate: Optional[int] = None  # paise

class InviteIn(BaseModel):
    creator_user_id: uuid.UUID
    message: Optional[str] = None

class RequestPatch(BaseModel):
    status: str  # accepted | rejected | negotiating | withdrawn
    proposed_rate: Optional[int] = None
    message: Optional[str] = None

class DealStatusPatch(BaseModel):
    status: str  # in_progress | review | completed | disputed | cancelled

class MessageIn(BaseModel):
    message: str
    attachment_url: Optional[str] = None

class DeliverableIn(BaseModel):
    project_id: Optional[uuid.UUID] = None

class DeliverablePatch(BaseModel):
    status: str  # approved | revision_requested
    review_note: Optional[str] = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _creator_out(cp: CreatorProfile) -> dict:
    return {
        "user_id": str(cp.user_id),
        "name": cp.user.name if cp.user else None,
        "bio": cp.bio,
        "niches": cp.niches,
        "languages": cp.languages,
        "rate_per_reel": cp.rate_per_reel,
        "portfolio_urls": cp.portfolio_urls,
        "instagram_handle": cp.instagram_handle,
        "youtube_handle": cp.youtube_handle,
        "follower_count": cp.follower_count,
        "is_verified": cp.is_verified,
        "is_active": cp.is_active,
        "avg_rating": cp.avg_rating,
        "total_deals": cp.total_deals,
    }

def _brief_out(b: Brief) -> dict:
    total_paise = b.num_reels * b.budget_per_reel
    return {
        "id": str(b.id),
        "brand_user_id": str(b.brand_user_id),
        "title": b.title,
        "description": b.description,
        "niches": b.niches,
        "languages": b.languages,
        "num_reels": b.num_reels,
        "budget_per_reel": b.budget_per_reel,
        "timeline_days": b.timeline_days,
        "requirements": b.requirements,
        "status": b.status,
        "total_budget": total_paise,
        "creator_payout": int(total_paise * CREATOR_TAKE),
        "created_at": b.created_at,
    }

def _deal_out(d: Deal) -> dict:
    return {
        "id": str(d.id),
        "brief_id": str(d.brief_id),
        "creator_user_id": str(d.creator_user_id),
        "brand_user_id": str(d.brand_user_id),
        "total_amount": d.total_amount,
        "creator_payout": int(d.total_amount * CREATOR_TAKE),
        "num_reels": d.num_reels,
        "delivered_reels": d.delivered_reels,
        "status": d.status,
        "deadline": d.deadline,
        "upfront_paid_at": d.upfront_paid_at,
        "final_paid_at": d.final_paid_at,
        "created_at": d.created_at,
    }


# ─── Creator profile ──────────────────────────────────────────────────────────

@router.get("/creator/profile")
async def get_my_creator_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cp = await db.get(CreatorProfile, current_user.id)
    if not cp:
        raise HTTPException(404, "Creator profile not found")
    await db.refresh(cp, ["user"])
    return _creator_out(cp)


@router.put("/creator/profile")
async def upsert_creator_profile(
    body: CreatorProfileIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cp = await db.get(CreatorProfile, current_user.id)
    if cp is None:
        cp = CreatorProfile(user_id=current_user.id)
        db.add(cp)
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(cp, field, val)
    await db.commit()
    await db.refresh(cp)
    await db.refresh(cp, ["user"])
    return _creator_out(cp)


# ─── Brand profile ────────────────────────────────────────────────────────────

@router.get("/brand/profile")
async def get_my_brand_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bp = await db.get(BrandProfile, current_user.id)
    if not bp:
        raise HTTPException(404, "Brand profile not found")
    return {
        "user_id": str(bp.user_id),
        "company_name": bp.company_name,
        "industry": bp.industry,
        "website": bp.website,
        "gstin": bp.gstin,
        "logo_url": bp.logo_url,
        "total_briefs_posted": bp.total_briefs_posted,
        "total_spend": bp.total_spend,
    }


@router.put("/brand/profile")
async def upsert_brand_profile(
    body: BrandProfileIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bp = await db.get(BrandProfile, current_user.id)
    if bp is None:
        bp = BrandProfile(user_id=current_user.id)
        db.add(bp)
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(bp, field, val)
    await db.commit()
    await db.refresh(bp)
    return {
        "user_id": str(bp.user_id),
        "company_name": bp.company_name,
        "industry": bp.industry,
        "website": bp.website,
        "gstin": bp.gstin,
        "logo_url": bp.logo_url,
        "total_briefs_posted": bp.total_briefs_posted,
        "total_spend": bp.total_spend,
    }


# ─── Creator discovery (public) ───────────────────────────────────────────────

@router.get("/creators")
async def search_creators(
    niche: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    min_rate: Optional[int] = Query(None),
    max_rate: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
):
    q = select(CreatorProfile).where(CreatorProfile.is_active == True)
    if niche:
        q = q.where(CreatorProfile.niches.contains([niche]))
    if language:
        q = q.where(CreatorProfile.languages.contains([language]))
    if min_rate is not None:
        q = q.where(CreatorProfile.rate_per_reel >= min_rate)
    if max_rate is not None:
        q = q.where(CreatorProfile.rate_per_reel <= max_rate)
    q = q.options(selectinload(CreatorProfile.user)).offset(skip).limit(limit)
    result = await db.execute(q)
    creators = result.scalars().all()
    return [_creator_out(c) for c in creators]


@router.get("/creators/{creator_user_id}")
async def get_creator(
    creator_user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    cp = await db.get(CreatorProfile, creator_user_id, options=[selectinload(CreatorProfile.user)])
    if not cp:
        raise HTTPException(404, "Creator not found")
    return _creator_out(cp)


# ─── Briefs ───────────────────────────────────────────────────────────────────

@router.get("/briefs")
async def list_briefs(
    niche: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    min_budget: Optional[int] = Query(None),
    max_budget: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
):
    q = select(Brief).where(Brief.status == "open")
    if niche:
        q = q.where(Brief.niches.contains([niche]))
    if language:
        q = q.where(Brief.languages.contains([language]))
    if min_budget is not None:
        q = q.where(Brief.budget_per_reel >= min_budget)
    if max_budget is not None:
        q = q.where(Brief.budget_per_reel <= max_budget)
    q = q.order_by(Brief.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return [_brief_out(b) for b in result.scalars().all()]


@router.post("/briefs", status_code=201)
async def create_brief(
    body: BriefIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bp = await db.get(BrandProfile, current_user.id)
    if not bp:
        raise HTTPException(400, "Complete brand profile first")
    brief = Brief(brand_user_id=current_user.id, **body.model_dump())
    db.add(brief)
    bp.total_briefs_posted += 1
    await db.commit()
    await db.refresh(brief)
    return _brief_out(brief)


@router.get("/briefs/{brief_id}")
async def get_brief(brief_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    brief = await db.get(Brief, brief_id)
    if not brief:
        raise HTTPException(404, "Brief not found")
    return _brief_out(brief)


@router.patch("/briefs/{brief_id}")
async def update_brief(
    brief_id: uuid.UUID,
    body: BriefPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brief = await db.get(Brief, brief_id)
    if not brief:
        raise HTTPException(404, "Brief not found")
    if brief.brand_user_id != current_user.id:
        raise HTTPException(403, "Not your brief")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(brief, field, val)
    await db.commit()
    await db.refresh(brief)
    return _brief_out(brief)


@router.get("/brand/briefs")
async def my_brand_briefs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Brief).where(Brief.brand_user_id == current_user.id).order_by(Brief.created_at.desc())
    result = await db.execute(q)
    return [_brief_out(b) for b in result.scalars().all()]


# ─── Deal requests ────────────────────────────────────────────────────────────

@router.post("/briefs/{brief_id}/apply", status_code=201)
async def apply_to_brief(
    brief_id: uuid.UUID,
    body: ApplyIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brief = await db.get(Brief, brief_id)
    if not brief or brief.status != "open":
        raise HTTPException(400, "Brief not available")
    # prevent duplicate
    existing = await db.execute(
        select(DealRequest).where(
            DealRequest.brief_id == brief_id,
            DealRequest.creator_user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Already applied to this brief")
    req = DealRequest(
        brief_id=brief_id,
        creator_user_id=current_user.id,
        initiated_by="creator",
        message=body.message,
        proposed_rate=body.proposed_rate,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return {"id": str(req.id), "status": req.status, "brief_id": str(req.brief_id)}


@router.post("/briefs/{brief_id}/invite", status_code=201)
async def invite_creator(
    brief_id: uuid.UUID,
    body: InviteIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brief = await db.get(Brief, brief_id)
    if not brief or brief.brand_user_id != current_user.id:
        raise HTTPException(403, "Not your brief")
    req = DealRequest(
        brief_id=brief_id,
        creator_user_id=body.creator_user_id,
        initiated_by="brand",
        message=body.message,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return {"id": str(req.id), "status": req.status}


@router.patch("/requests/{request_id}")
async def update_request(
    request_id: uuid.UUID,
    body: RequestPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    req = await db.get(DealRequest, request_id, options=[selectinload(DealRequest.brief)])
    if not req:
        raise HTTPException(404, "Request not found")

    brief = req.brief
    is_brand = brief.brand_user_id == current_user.id
    is_creator = req.creator_user_id == current_user.id

    if not (is_brand or is_creator):
        raise HTTPException(403, "Forbidden")

    allowed_transitions = {
        "brand":   {"accepted", "rejected"},
        "creator": {"withdrawn", "negotiating"},
    }
    role = "brand" if is_brand else "creator"
    if body.status not in allowed_transitions[role]:
        raise HTTPException(400, f"Cannot set status '{body.status}' as {role}")

    req.status = body.status
    if body.proposed_rate is not None:
        req.proposed_rate = body.proposed_rate
    if body.message:
        req.message = body.message

    # When brand accepts → create the deal
    if body.status == "accepted":
        rate = req.proposed_rate or brief.budget_per_reel
        deadline = datetime.now(timezone.utc) + timedelta(days=brief.timeline_days)
        deal = Deal(
            brief_id=brief.id,
            creator_user_id=req.creator_user_id,
            brand_user_id=brief.brand_user_id,
            total_amount=brief.num_reels * rate,
            num_reels=brief.num_reels,
            deadline=deadline,
        )
        db.add(deal)
        brief.status = "closed"

    await db.commit()
    await db.refresh(req)
    return {"id": str(req.id), "status": req.status}


# ─── Deals ────────────────────────────────────────────────────────────────────

@router.get("/deals")
async def my_deals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Deal).where(
        or_(Deal.creator_user_id == current_user.id, Deal.brand_user_id == current_user.id)
    ).order_by(Deal.created_at.desc())
    result = await db.execute(q)
    return [_deal_out(d) for d in result.scalars().all()]


@router.get("/deals/{deal_id}")
async def get_deal(
    deal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deal = await db.get(Deal, deal_id, options=[
        selectinload(Deal.deliverables),
    ])
    if not deal:
        raise HTTPException(404, "Deal not found")
    if deal.creator_user_id != current_user.id and deal.brand_user_id != current_user.id:
        raise HTTPException(403, "Forbidden")
    out = _deal_out(deal)
    out["deliverables"] = [
        {
            "id": str(dv.id),
            "project_id": str(dv.project_id) if dv.project_id else None,
            "status": dv.status,
            "review_note": dv.review_note,
            "submitted_at": dv.submitted_at,
        }
        for dv in deal.deliverables
    ]
    return out


@router.patch("/deals/{deal_id}/status")
async def update_deal_status(
    deal_id: uuid.UUID,
    body: DealStatusPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deal = await db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(404, "Deal not found")
    if deal.creator_user_id != current_user.id and deal.brand_user_id != current_user.id:
        raise HTTPException(403, "Forbidden")
    deal.status = body.status
    await db.commit()
    await db.refresh(deal)
    return _deal_out(deal)


# ─── Deal messages ────────────────────────────────────────────────────────────

@router.post("/deals/{deal_id}/messages", status_code=201)
async def send_message(
    deal_id: uuid.UUID,
    body: MessageIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deal = await db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(404, "Deal not found")
    if deal.creator_user_id != current_user.id and deal.brand_user_id != current_user.id:
        raise HTTPException(403, "Forbidden")
    msg = DealMessage(
        deal_id=deal_id,
        sender_user_id=current_user.id,
        message=body.message,
        attachment_url=body.attachment_url,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return {
        "id": str(msg.id),
        "sender_user_id": str(msg.sender_user_id),
        "message": msg.message,
        "attachment_url": msg.attachment_url,
        "created_at": msg.created_at,
    }


@router.get("/deals/{deal_id}/messages")
async def get_messages(
    deal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deal = await db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(404, "Deal not found")
    if deal.creator_user_id != current_user.id and deal.brand_user_id != current_user.id:
        raise HTTPException(403, "Forbidden")
    q = select(DealMessage).where(DealMessage.deal_id == deal_id).order_by(DealMessage.created_at)
    result = await db.execute(q)
    return [
        {
            "id": str(m.id),
            "sender_user_id": str(m.sender_user_id),
            "message": m.message,
            "attachment_url": m.attachment_url,
            "created_at": m.created_at,
        }
        for m in result.scalars().all()
    ]


# ─── Deliverables ─────────────────────────────────────────────────────────────

@router.post("/deals/{deal_id}/deliver", status_code=201)
async def submit_deliverable(
    deal_id: uuid.UUID,
    body: DeliverableIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deal = await db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(404, "Deal not found")
    if deal.creator_user_id != current_user.id:
        raise HTTPException(403, "Only creator can submit deliverables")
    if deal.status not in ("in_progress", "review"):
        raise HTTPException(400, f"Cannot deliver on deal with status '{deal.status}'")
    dv = DealDeliverable(deal_id=deal_id, project_id=body.project_id)
    db.add(dv)
    deal.delivered_reels += 1
    if deal.delivered_reels >= deal.num_reels:
        deal.status = "review"
    await db.commit()
    await db.refresh(dv)
    return {
        "id": str(dv.id),
        "deal_id": str(dv.deal_id),
        "project_id": str(dv.project_id) if dv.project_id else None,
        "status": dv.status,
        "submitted_at": dv.submitted_at,
    }


@router.patch("/deliverables/{deliv_id}")
async def review_deliverable(
    deliv_id: uuid.UUID,
    body: DeliverablePatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dv = await db.get(DealDeliverable, deliv_id, options=[selectinload(DealDeliverable.deal)])
    if not dv:
        raise HTTPException(404, "Deliverable not found")
    deal = dv.deal
    if deal.brand_user_id != current_user.id:
        raise HTTPException(403, "Only brand can review deliverables")
    if body.status not in ("approved", "revision_requested"):
        raise HTTPException(400, "status must be approved or revision_requested")
    dv.status = body.status
    dv.review_note = body.review_note
    dv.reviewed_at = datetime.now(timezone.utc)

    if body.status == "revision_requested":
        deal.delivered_reels = max(0, deal.delivered_reels - 1)
        deal.status = "in_progress"

    await db.commit()
    await db.refresh(dv)
    return {
        "id": str(dv.id),
        "status": dv.status,
        "review_note": dv.review_note,
        "reviewed_at": dv.reviewed_at,
    }
