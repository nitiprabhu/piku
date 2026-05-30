from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from app.database import get_db
from app.models.publish_job import Template
from app.models.user import User
from app.api.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/templates", tags=["templates"])


class TemplateResponse(BaseModel):
    id: str
    name: str
    category: str | None
    language: str | None
    description: str | None
    template_type: str
    prompt_examples: list[str] | None
    style_config: dict | None
    thumbnail_url: str | None
    sort_order: int

    model_config = {"from_attributes": True}


@router.get("", response_model=list[TemplateResponse])
async def list_templates(
    category: str | None = Query(None),
    language: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    filters = [Template.is_active == True]
    if category:
        filters.append(Template.category == category)
    if language:
        filters.append(Template.language == language)

    result = await db.execute(
        select(Template).where(and_(*filters)).order_by(Template.sort_order)
    )
    return [TemplateResponse.model_validate(t) for t in result.scalars().all()]


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: str, db: AsyncSession = Depends(get_db)):
    from fastapi import HTTPException
    result = await db.execute(
        select(Template).where(Template.id == template_id, Template.is_active == True)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return TemplateResponse.model_validate(template)


class IdeasResponse(BaseModel):
    ideas: list[str]


@router.get("/{template_id}/ideas", response_model=IdeasResponse)
async def generate_ideas(template_id: str, db: AsyncSession = Depends(get_db)):
    from fastapi import HTTPException
    import openai, json

    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    lang_map = {"hi": "Hindi", "en": "English", "hinglish": "Hinglish (Hindi+English mix)", "kn": "Kannada (ಕನ್ನಡ)"}
    template_lang = template.language or "hi"
    language = lang_map.get(template_lang, "Hindi")
    examples = "\n".join(f"- {e}" for e in (template.prompt_examples or [])[:2])

    system = (
        "You generate creative reel prompt ideas for Indian short-video creators. "
        "Each idea should be specific, vivid, and ready to use as a video prompt — not a vague topic. "
        "Return ONLY a JSON array of 3 strings. No explanation."
    )
    user_msg = (
        f"Template: {template.name} (category: {template.category}, language: {language})\n"
        f"Example prompts for reference style:\n{examples}\n\n"
        "Generate 3 FRESH, DIFFERENT prompt ideas in the same language and style. "
        "Each should be a full descriptive sentence, not just a topic. Be creative and varied."
    )

    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user_msg}],
        temperature=1.0,
        max_tokens=400,
    )
    raw = resp.choices[0].message.content.strip()
    # strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    ideas = json.loads(raw)
    if not isinstance(ideas, list):
        raise HTTPException(status_code=500, detail="Bad response from AI")
    return {"ideas": ideas[:3]}
