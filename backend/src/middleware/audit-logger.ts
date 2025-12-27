import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../lib/db';
import { generateDescription } from '../services/audit-description-generator';

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'accessToken', 'refreshToken'];

/**
 * Recursively filters sensitive data from objects
 */
function filterSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(filterSensitiveData);
  }

  const filtered: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      filtered[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      filtered[key] = filterSensitiveData(value);
    } else {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Capitalizes first letter of a string
 */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Maps HTTP methods to audit actions
 */
function getActionFromMethod(method: string): string {
  switch (method) {
    case 'POST': return 'CREATE';
    case 'PATCH':
    case 'PUT': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return 'UNKNOWN';
  }
}

/**
 * Extracts resource information from request path
 */
function extractResourceInfo(path: string, body: any): { resourceType: string; resourceId: string } {
  // Match patterns like /api/users/123 or /api/departments
  const match = path.match(/\/api\/(?:admin\/)?(\w+)(?:\/([^/]+))?/);

  if (!match) {
    return {
      resourceType: 'Unknown',
      resourceId: 'unknown'
    };
  }

  const resourceType = capitalize(match[1] || 'Unknown');
  const resourceId = match[2] || body?.id || 'unknown';

  return { resourceType, resourceId };
}

/**
 * Middleware to automatically log all mutating operations
 * Captures before/after states, filters sensitive fields, and records metadata
 *
 * Usage: Apply to routes that should be audited
 * router.post('/users', authenticateToken, auditLogger, async (req, res) => { ... });
 */
export async function auditLogger(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Only log mutating operations
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Store original body for 'before' state
  const originalBody = { ...req.body };

  // Capture original send to intercept response
  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);

  let responseData: any = null;
  let errorMessage: string | null = null;

  // Override send
  res.send = function (data: any) {
    responseData = data;
    return originalSend(data);
  };

  // Override json
  res.json = function (data: any) {
    responseData = data;
    return originalJson(data);
  };

  // Wait for response to complete
  res.on('finish', async () => {
    try {
      const { resourceType, resourceId } = extractResourceInfo(req.path, req.body);
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      const status = isSuccess ? 'success' : 'failed';

      // Extract error message from response for failed operations
      if (!isSuccess && responseData) {
        try {
          const parsedData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
          errorMessage = parsedData?.error || parsedData?.message || `HTTP ${res.statusCode}`;
        } catch {
          errorMessage = `HTTP ${res.statusCode}`;
        }
      }

      // Prepare changes object
      const changes = {
        before: filterSensitiveData((req as any).beforeState || req.body._before || null),
        after: filterSensitiveData(originalBody)
      };

      // Prepare metadata
      const metadata = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.path
      };

      // Generate human-readable description
      const description = await generateDescription({
        userId: req.user?.id,
        action: getActionFromMethod(req.method) as 'CREATE' | 'UPDATE' | 'DELETE',
        resourceType,
        resourceId: String(resourceId),
        changes,
        metadata,
        status,
        errorMessage: errorMessage || undefined
      });

      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          action: getActionFromMethod(req.method),
          resourceType,
          resourceId: String(resourceId),
          changes: JSON.stringify(changes),
          metadata: JSON.stringify(metadata),
          status,
          errorMessage,
          description
        }
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('Failed to create audit log:', error);
    }
  });

  next();
}

/**
 * Helper to create audit log entries manually for complex operations
 */
export async function createAuditLog(data: {
  userId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  resourceType: string;
  resourceId: string;
  changes?: { before?: any; after?: any };
  metadata?: any;
  status?: 'success' | 'failed';
  errorMessage?: string;
}) {
  try {
    // Generate human-readable description
    const description = await generateDescription({
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      changes: data.changes,
      metadata: data.metadata,
      status: data.status,
      errorMessage: data.errorMessage
    });

    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        changes: data.changes ? JSON.stringify({
          before: filterSensitiveData(data.changes.before),
          after: filterSensitiveData(data.changes.after)
        }) : null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        status: data.status || 'success',
        errorMessage: data.errorMessage || null,
        description
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
