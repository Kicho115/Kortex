from fastapi import FastAPI, Depends, HTTPException, status
from sqlmodel import Session, select

from db import init_db, get_session
from models import User, UserCreate, UserRead
from security import hash_password

app = FastAPI()


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    session: Session = Depends(get_session),
):
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email,
        name=payload.name,
        hashed_password=hash_password(payload.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
