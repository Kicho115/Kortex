const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

interface LLMChatResponse {
  message: LLMMessage;
}

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
  return "La solicitud no se pudo completar.";
}

export async function chatWithLlm(messages: LLMMessage[]): Promise<LLMMessage> {
  const response = await fetch(`${API_BASE}/llm/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = (await response.json()) as LLMChatResponse;
  return data.message;
}
