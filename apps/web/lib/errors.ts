import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ForbiddenError } from "./authz";

export class NotFoundError extends Error {
  code = "NOT_FOUND";
}
export class UnauthenticatedError extends Error {
  code = "UNAUTHENTICATED";
  constructor(message = "Authentication required.") { super(message); }
}

/** Maps any thrown error to the API.md error shape without leaking internals. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request.", details: err.flatten() } },
      { status: 400 }
    );
  }
  if (err instanceof UnauthenticatedError) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: err.message } }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: err.message } }, { status: 403 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Resource not found." } }, { status: 404 });
  }
  // Unknown/unexpected: log full detail server-side, return a generic message.
  const correlationId = crypto.randomUUID();
  console.error(`[${correlationId}]`, err);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong.", details: { correlationId } } },
    { status: 500 }
  );
}
