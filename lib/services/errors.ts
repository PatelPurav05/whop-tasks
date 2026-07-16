export type DomainErrorCode =
  | "CONFLICT"
  | "EXPIRED"
  | "FORBIDDEN"
  | "INSUFFICIENT_FUNDS"
  | "INVALID_STATE"
  | "NOT_FOUND"
  | "VALIDATION";

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function assertDomain(
  condition: unknown,
  code: DomainErrorCode,
  message: string,
  details?: Record<string, unknown>,
): asserts condition {
  if (!condition) {
    throw new DomainError(code, message, details);
  }
}
