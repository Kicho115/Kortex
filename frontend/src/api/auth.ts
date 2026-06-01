import type { UserRead } from '../types/user'

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

export async function registerUser(body: {
  email: string
  name: string
  password: string
}): Promise<UserRead> {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json() as Promise<UserRead>
}

export async function loginUser(body: {
  email: string
  password: string
}): Promise<UserRead> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json() as Promise<UserRead>
}
