export function newRequestId(): string {
  return crypto.randomUUID();
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

type JsonInit = {
  status?: number;
  headers?: Record<string, string>;
};

export function jsonResponse(body: unknown, init: JsonInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...init.headers,
    },
  });
}

export class ApiHttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorResponse(
  err: ApiHttpError,
  requestId: string,
  extraHeaders: Record<string, string> = {}
): Response {
  return jsonResponse(
    {
      error: {
        code: err.code,
        message: err.message,
        requestId,
      },
    },
    { status: err.status, headers: extraHeaders }
  );
}
