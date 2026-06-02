from datetime import datetime
from typing import List, Literal, Optional

from sqlmodel import Field, SQLModel


class UserBase(SQLModel):
    email: str
    name: str


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    created_at: datetime


class UserLogin(SQLModel):
    email: str
    password: str


class Chat(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ChatCreate(SQLModel):
    name: str


class ChatRead(SQLModel):
    id: int
    name: str
    created_at: datetime


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: int = Field(foreign_key="chat.id")
    sender_id: int = Field(foreign_key="user.id")
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MessageCreate(SQLModel):
    sender_id: int
    content: str


class MessageRead(SQLModel):
    id: int
    chat_id: int
    sender_id: int
    content: str
    created_at: datetime


class LLMMessage(SQLModel):
    role: Literal["system", "user", "assistant"]
    content: str


class LLMChatRequest(SQLModel):
    messages: List[LLMMessage]


class LLMChatResponse(SQLModel):
    message: LLMMessage
