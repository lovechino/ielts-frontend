import sys
import os
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

# Adjust path to find backend app
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from app.models.vocabulary import Vocabulary
from app.core.config import settings

def get_session_maker():
    engine = create_async_engine(settings.async_database_url)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def save_vocabulary(session: AsyncSession, details: dict, level: str) -> bool:
    """Insert word into DB if it doesn't exist. Returns True if inserted."""
    existing = await session.execute(
        select(Vocabulary).where(Vocabulary.word == details["word"])
    )
    if existing.scalar_one_or_none():
        return False

    vocab = Vocabulary(
        id=uuid4(),
        word=details["word"],
        definition=details["definition"],
        example=details["example"] or None,
        pronunciation=details["pronunciation"] or None,
        topic=details["topic"],
        level=level,
        synonyms=details["synonyms"] or None,
        antonyms=details["antonyms"] or None,
    )
    session.add(vocab)
    await session.commit()
    return True
