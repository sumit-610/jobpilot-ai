from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    environment: str = "development"
    secret_key: str = "change-this"
    cors_origins: List[str] = ["http://localhost:3000"]

    # Database
    database_url: str

    # Redis / Celery
    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/1"

    # Clerk
    clerk_publishable_key: str = ""
    clerk_secret_key: str = ""
    clerk_jwt_issuer: str = ""

    # OpenAI
    openai_api_key: str
    openai_embedding_model: str = "text-embedding-3-small"
    openai_chat_model: str = "gpt-4o"

    # Pinecone
    pinecone_api_key: str = ""
    pinecone_environment: str = ""
    pinecone_index_name: str = "jobpilot-jobs"

    # Scraper schedule
    scrape_hour: int = 7
    scrape_minute: int = 52
    job_score_threshold: int = 60
    max_jobs_per_digest: int = 20

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


settings = Settings()
