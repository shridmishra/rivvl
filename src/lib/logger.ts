import fs from 'fs';
import path from 'path';

type Severity = 'ERROR' | 'WARN' | 'CRASH' | 'API_FAIL' | 'PAYMENT_FAIL';

interface LogContext {
  userId?: string;
  route?: string;
  planTier?: string;
  vertical?: string;
  [key: string]: unknown;
}

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lk = key.toLowerCase();
    if (lk.includes('key') || lk.includes('secret') || lk.includes('token') || lk.includes('password') || lk.includes('email') || lk.includes('authorization')) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function getLogFilePath(): string {
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.join(process.cwd(), 'crash-reports');
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // silently fail
  }
  return path.join(dir, `crash-report-${date}.log`);
}

function writeLog(severity: Severity, location: string, message: string, context?: LogContext, stack?: string): void {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      severity,
      location,
      message,
      ...(context ? { context: sanitize(context) } : {}),
      ...(stack ? { stack } : {}),
    };
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(getLogFilePath(), line, 'utf-8');
  } catch {
    // Logger must never throw
  }
}

export function logError(location: string, error: Error | unknown, context?: LogContext): void {
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  writeLog('ERROR', location, msg, context, stack);
}

export function logWarn(location: string, message: string, context?: LogContext): void {
  writeLog('WARN', location, message, context);
}

export function logCrash(location: string, error: Error | unknown, context?: LogContext): void {
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  writeLog('CRASH', location, msg, context, stack);
}

export function logAPIFail(route: string, statusCode: number, error: string, context?: LogContext): void {
  writeLog('API_FAIL', route, `HTTP ${statusCode}: ${error}`, context);
}

export function logPaymentFail(userId: string, role: string, sessionId: string, error: string): void {
  writeLog('PAYMENT_FAIL', 'stripe', error, { userId, planTier: role, route: `session:${sessionId}` });
}
