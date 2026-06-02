import type { ChatCreate, ChatRead, MessageCreate, MessageRead } from '../types/chat'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string | { msg: string }[] }
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) {
      return data.detail.map((item) => item.msg).join('. ')
    }
  } catch {
    /* ignore */
  }
  return 'Ocurrió un error. Inténtalo de nuevo.'
}

export async function listChats(): Promise<ChatRead[]> {
  const response = await fetch(`${API_BASE}/chats`)
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
  return response.json() as Promise<ChatRead[]>
}

export async function createChat(body: ChatCreate): Promise<ChatRead> {
  const response = await fetch(`${API_BASE}/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json() as Promise<ChatRead>
}

export async function getChat(chatId: number): Promise<ChatRead> {
  const response = await fetch(`${API_BASE}/chats/${chatId}`)
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
  return response.json() as Promise<ChatRead>
}

export async function listMessages(chatId: number): Promise<MessageRead[]> {
  const response = await fetch(`${API_BASE}/chats/${chatId}/messages`)
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
  return response.json() as Promise<MessageRead[]>
}

export async function sendMessage(
  chatId: number,
  body: MessageCreate,
): Promise<MessageRead> {
  const response = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json() as Promise<MessageRead>
}
