import * as globals from "src/globals";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const authHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${globals.accessToken.value || ""}`,
  "Content-Type": "application/json",
});

const parseResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

const checkResponse = async (response: Response) => {
  if (response.ok) return parseResponse(response);
  const body = await parseResponse(response);
  throw new ApiError(response.status, body?.error ?? `HTTP ${response.status}`);
};

export const apiGet = async (url: string) => {
  const response = await fetch(url, { headers: authHeaders() });
  return checkResponse(response);
};

export const apiPost = async (url: string, body?: unknown) => {
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return checkResponse(response);
};
