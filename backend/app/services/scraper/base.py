from dataclasses import dataclass
from datetime import datetime


@dataclass
class RawJob:
    platform: str
    external_id: str | None
    title: str
    company: str
    location: str | None
    url: str
    job_type: str | None
    work_mode: str | None
    raw_description: str | None
    posted_at: datetime | None