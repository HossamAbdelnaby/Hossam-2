import { logActivity } from '@/app/api/admin/logs/route';

export interface ActivityLogData {
  action: string;
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'error' | 'warning';
  category: 'auth' | 'tournament' | 'user' | 'system' | 'security' | 'admin';
  metadata?: any;
}

/**
 * Log user activity to the system
 * This function can be called from anywhere in the application
 */
export async function logUserActivity(data: ActivityLogData) {
  try {
    // Get IP address and user agent from request context if available
    const ip = data.ipAddress || '127.0.0.1';
    const userAgent = data.userAgent || 'Unknown';
    
    await logActivity({
      ...data,
      ipAddress: ip,
      userAgent
    });
  } catch (error) {
    console.error('Failed to log user activity:', error);
    // Don't throw the error to avoid disrupting the main functionality
  }
}

/**
 * Log authentication activities
 */
export async function logAuthActivity(
  action: 'Login' | 'Logout' | 'Password Change' | 'Email Verification' | '2FA Setup' | 'Failed Login',
  description: string,
  user: { id: string; email: string; username: string; name: string; role: string },
  status: 'success' | 'error' | 'warning' = 'success',
  ipAddress?: string,
  userAgent?: string
) {
  await logUserActivity({
    action,
    description,
    userId: user.id,
    userName: user.name || user.username,
    userEmail: user.email,
    userRole: user.role,
    ipAddress,
    userAgent,
    status,
    category: 'auth'
  });
}

/**
 * Log tournament activities
 */
export async function logTournamentActivity(
  action: 'Create Tournament' | 'Update Tournament' | 'Delete Tournament' | 'Register Team' | 'Update Bracket',
  description: string,
  user: { id: string; email: string; username: string; name: string; role: string },
  status: 'success' | 'error' | 'warning' = 'success',
  ipAddress?: string,
  userAgent?: string,
  metadata?: any
) {
  await logUserActivity({
    action,
    description,
    userId: user.id,
    userName: user.name || user.username,
    userEmail: user.email,
    userRole: user.role,
    ipAddress,
    userAgent,
    status,
    category: 'tournament',
    metadata
  });
}

/**
 * Log user management activities
 */
export async function logUserManagementActivity(
  action: 'Create User' | 'Update Profile' | 'Delete Account' | 'Change Password' | 'Upload Avatar',
  description: string,
  user: { id: string; email: string; username: string; name: string; role: string },
  status: 'success' | 'error' | 'warning' = 'success',
  ipAddress?: string,
  userAgent?: string
) {
  await logUserActivity({
    action,
    description,
    userId: user.id,
    userName: user.name || user.username,
    userEmail: user.email,
    userRole: user.role,
    ipAddress,
    userAgent,
    status,
    category: 'user'
  });
}

/**
 * Log system activities
 */
export async function logSystemActivity(
  action: 'System Update' | 'Configuration Change' | 'Backup Created' | 'Cache Cleared' | 'Settings Updated',
  description: string,
  user: { id: string; email: string; username: string; name: string; role: string },
  status: 'success' | 'error' | 'warning' = 'success',
  ipAddress?: string,
  userAgent?: string,
  metadata?: any
) {
  await logUserActivity({
    action,
    description,
    userId: user.id,
    userName: user.name || user.username,
    userEmail: user.email,
    userRole: user.role,
    ipAddress,
    userAgent,
    status,
    category: 'system',
    metadata
  });
}

/**
 * Log security activities
 */
export async function logSecurityActivity(
  action: 'Failed Login' | 'Password Reset' | 'Account Locked' | 'Suspicious Activity' | 'Access Denied',
  description: string,
  user?: { id: string; email: string; username: string; name: string; role: string },
  status: 'success' | 'error' | 'warning' = 'warning',
  ipAddress?: string,
  userAgent?: string,
  metadata?: any
) {
  await logUserActivity({
    action,
    description,
    userId: user?.id || 'unknown',
    userName: user?.name || user?.username || 'Unknown User',
    userEmail: user?.email || 'unknown@example.com',
    userRole: user?.role || 'UNKNOWN',
    ipAddress,
    userAgent,
    status,
    category: 'security',
    metadata
  });
}

/**
 * Log admin activities
 */
export async function logAdminActivity(
  action: 'User Management' | 'Permission Change' | 'System Settings' | 'Logs Viewed' | 'Data Export',
  description: string,
  user: { id: string; email: string; username: string; name: string; role: string },
  status: 'success' | 'error' | 'warning' = 'success',
  ipAddress?: string,
  userAgent?: string,
  metadata?: any
) {
  await logUserActivity({
    action,
    description,
    userId: user.id,
    userName: user.name || user.username,
    userEmail: user.email,
    userRole: user.role,
    ipAddress,
    userAgent,
    status,
    category: 'admin',
    metadata
  });
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (real) {
    return real;
  }
  
  return '127.0.0.1';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'Unknown';
}