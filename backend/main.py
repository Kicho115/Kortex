from typing import Dict, List, Set

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlmodel import Session, select, col

from db import init_db, get_session, engine
from models import (
    User,
    UserCreate,
    UserRead,
    UserLogin,
    Chat,
    ChatCreate,
    ChatRead,
    Message,
    MessageCreate,
    MessageRead,
)
from security import hash_password, verify_password

app = FastAPI()


class ConnectionManager:
    def __init__(self) -> None:
        self.active: Dict[int, Set[WebSocket]] = {}

    async def connect(self, chat_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.setdefault(chat_id, set()).add(websocket)

    def disconnect(self, chat_id: int, websocket: WebSocket) -> None:
        connections = self.active.get(chat_id)
        if not connections:
            return
        connections.discard(websocket)
        if not connections:
            self.active.pop(chat_id, None)

    async def broadcast(self, chat_id: int, message: dict) -> None:
        for websocket in list(self.active.get(chat_id, set())):
            await websocket.send_json(message)


manager = ConnectionManager()


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


@app.post("/login", response_model=UserRead)
def login(
    payload: UserLogin,
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    return user


@app.post("/chats", response_model=ChatRead, status_code=status.HTTP_201_CREATED)
def create_chat(
    payload: ChatCreate,
    session: Session = Depends(get_session),
):
    chat = Chat(name=payload.name)
    session.add(chat)
    session.commit()
    session.refresh(chat)
    
    return ChatRead(
        id=chat.id,
        name=chat.name,
        created_at=chat.created_at,
    )


@app.get("/chats/{chat_id}", response_model=ChatRead)
def get_chat(
    chat_id: int,
    session: Session = Depends(get_session),
):
    chat = session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return ChatRead(
        id=chat.id,
        name=chat.name,
        created_at=chat.created_at,
    )


@app.post(
    "/chats/{chat_id}/messages",
    response_model=MessageRead,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    chat_id: int,
    payload: MessageCreate,
    session: Session = Depends(get_session),
):
    chat = session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

    message = Message(
        chat_id=chat_id,
        sender_id=payload.sender_id,
        content=payload.content,
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return message


@app.get("/chats/{chat_id}/messages", response_model=List[MessageRead])
def list_messages(
    chat_id: int,
    session: Session = Depends(get_session),
):
    chat = session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

    messages = session.exec(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(col(Message.created_at))
    ).all()
    return messages


@app.websocket("/ws/chats/{chat_id}")
async def chat_socket(websocket: WebSocket, chat_id: int) -> None:
    await manager.connect(chat_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            try:
                payload = MessageCreate.model_validate(data)
            except Exception:
                await websocket.send_json({"error": "Invalid payload"})
                continue

            with Session(engine) as session:
                chat = session.get(Chat, chat_id)
                if not chat:
                    await websocket.send_json({"error": "Chat not found"})
                    continue

                sender = session.get(User, payload.sender_id)
                if not sender:
                    await websocket.send_json({"error": "Sender not found"})
                    continue

                message = Message(
                    chat_id=chat_id,
                    sender_id=payload.sender_id,
                    content=payload.content,
                )
                session.add(message)
                session.commit()
                session.refresh(message)
                outbound = MessageRead.model_validate(message).model_dump()

            await manager.broadcast(chat_id, outbound)
    except WebSocketDisconnect:
        manager.disconnect(chat_id, websocket)
