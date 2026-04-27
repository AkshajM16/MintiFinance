// Simple logger for security and error events
export function logSecurityEvent(event: string, details?: any) {
  // In production, send to a logging service
  console.log(`[SECURITY] ${event}`, details || '');
}

export function logError(error: any, context?: string) {
  // In production, send to a logging service
  console.error(`[ERROR]${context ? ' [' + context + ']' : ''}`, error);
} 