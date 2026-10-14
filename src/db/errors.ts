const FOREIGN_KEY_VIOLATION = "23503";

/** True when a delete fails because other rows still reference the record. */
export function isForeignKeyViolation(error: unknown): boolean {
  const cause = error instanceof Error && error.cause ? error.cause : error;
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    cause.code === FOREIGN_KEY_VIOLATION
  );
}
