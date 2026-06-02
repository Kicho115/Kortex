import type { UserRead } from "../types/user";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string | { msg: string }[];
    };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((item) => item.msg).join(". ");
    }
  } catch {
    /* ignore */
  }
  return "Ocurrió un error. Inténtalo de nuevo.";
}

export async function getUser(userId: number): Promise<UserRead> {
  const response = await fetch(`${API_BASE}/users/${userId}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json() as Promise<UserRead>;
}
