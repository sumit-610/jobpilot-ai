import io
import json
import logging

from openai import AsyncOpenAI
from pypdf import PdfReader

from app.core.config import settings

log = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.openai_api_key)

PARSE_PROMPT = """
You are a resume parser. Extract structured information from the resume text below.

Return ONLY valid JSON with exactly this structure. No markdown. No explanation. No extra fields.

{
  "full_name": "",
  "summary": "",
  "skills": [],
  "experience_years": 0,
  "experience": [
    {
      "title": "",
      "company": "",
      "duration_months": 0,
      "description": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "year": null
    }
  ],
  "projects": [
    {
      "name": "",
      "tech_stack": [],
      "description": ""
    }
  ]
}

Rules:
- skills: list every technical skill, tool, language, framework, and software mentioned
- experience_years: total years of work experience as a number (0 if student/fresher)
- duration_months: integer, estimate if not explicit
- summary: 2-3 sentence professional summary
- year in education: graduation year as integer or null if not found
- Return empty arrays [] if a section has no data

RESUME TEXT:
"""


def extract_text_from_pdf(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    pages = []

    for page in reader.pages:
        text = page.extract_text() or ""
        pages.append(text)

    return "\n".join(pages).strip()


async def parse_resume_pdf(content: bytes) -> dict:
    text = extract_text_from_pdf(content)

    if len(text) < 50:
        raise ValueError(
            "Could not extract text from PDF. "
            "The file may be image-based or empty."
        )

    log.info("Extracted %s characters from resume", len(text))

    try:
        response = await client.chat.completions.create(
            model=settings.openai_chat_model,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": "You are a resume parser. Return only valid JSON.",
                },
                {
                    "role": "user",
                    "content": PARSE_PROMPT + text[:12000],
                },
            ],
            temperature=0,
            max_tokens=1500,
        )

        raw = response.choices[0].message.content
        return json.loads(raw)

    except Exception as e:
        log.warning("OpenAI parse failed: %s", e)

        return {
            "summary": text[:500],
            "skills": [],
            "experience": [],
            "education": [],
            "projects": [],
            "experience_years": 0,
        }