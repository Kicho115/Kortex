export interface ChatRead {
  id: number
  name: string
  created_at: string
}

export interface ChatCreate {
  name: string
}

export interface MessageRead {
  id: number
  chat_id: number
  sender_id: number
  content: string
  created_at: string
}

export interface MessageCreate {
  sender_id: number
  content: string
}
