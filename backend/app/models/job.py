from datetime import datetime
from typing import Any
import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)  # linkedin, wellfound, etc.
    external_id: Mapped[str] = mapped_column(String(255), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255))
    url: Mapped[str] = mapped_column(Text, nullable=False)
    job_type: Mapped[str | None] = mapped_column(String(50))  # full-time, internship
    work_mode: Mapped[str | None] = mapped_column(String(50))  # remote, hybrid, onsite
    salary_min: Mapped[int | None] = mapped_column(Integer)
    salary_max: Mapped[int | None] = mapped_column(Integer)
    raw_description: Mapped[str | None] = mapped_column(Text)
    embedding: Mapped[list | None] = mapped_column(Vector(1536))  # text-embedding-3-small dim
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    scraped_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    dedup_hash: Mapped[str | None] = mapped_column(String(64), unique=True)

    scores: Mapped[list["JobScore"]] = relationship("JobScore", back_populates="job")
    applications: Mapped[list["Application"]] = relationship("Application", back_populates="job")


class JobScore(Base):
    __tablename__ = "job_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"))
    user_id: Mapped[str] = mapped_column(String(255), nullable=False)  # Clerk user ID
    match_score: Mapped[float] = mapped_column(Float, nullable=False)
    skills_matched: Mapped[list[str]] = mapped_column(ARRAY(String), default=[])
    skills_missing: Mapped[list[str]] = mapped_column(ARRAY(String), default=[])
    reasoning: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    job: Mapped["Job"] = relationship("Job", back_populates="scores")
