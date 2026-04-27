/**
 * Client-side security utilities.
 * Server-side security is handled by Django middleware and django-cors-headers.
 */

export function validateInput(input: unknown): boolean {
  return input !== null && input !== undefined;
}
