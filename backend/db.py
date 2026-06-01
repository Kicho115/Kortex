import os
from typing import Generator

from sqlmodel import SQLModel, Session, create_engine

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def init_db() -> None:
    import models

    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
