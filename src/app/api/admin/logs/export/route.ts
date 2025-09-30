import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getAuthUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    
    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

// Generate mock logs for export (same as in the main logs API)
const generateMockLogsForExport = (filters: any) => {
  const categories = ['auth', 'tournament', 'user', 'system', 'security', 'admin'];
  const actions = {
    auth: ['Login', 'Logout', 'Password Change', 'Email Verification', '2FA Setup'],
    tournament: ['Create Tournament', 'Update Tournament', 'Delete Tournament', 'Register Team', 'Update Bracket'],
    user: ['Create User', 'Update Profile', 'Delete Account', 'Change Password', 'Upload Avatar'],
    system: ['System Update', 'Configuration Change', 'Backup Created', 'Cache Cleared', 'Settings Updated'],
    security: ['Failed Login', 'Password Reset', 'Account Locked', 'Suspicious Activity', 'Access Denied'],
    admin: ['User Management', 'Permission Change', 'System Settings', 'Logs Viewed', 'Data Export']
  };
  
  const descriptions = {
    'Login': 'User successfully logged in to the system',
    'Logout': 'User logged out from the system',
    'Password Change': 'User changed their password',
    'Email Verification': 'User verified their email address',
    '2FA Setup': 'User set up two-factor authentication',
    'Create Tournament': 'Administrator created a new tournament',
    'Update Tournament': 'Tournament details were updated',
    'Delete Tournament': 'Tournament was deleted by administrator',
    'Register Team': 'Team registered for tournament',
    'Update Bracket': 'Tournament bracket was updated',
    'Create User': 'New user account was created',
    'Update Profile': 'User profile information was updated',
    'Delete Account': 'User account was deleted',
    'Change Password': 'User initiated password change',
    'Upload Avatar': 'User uploaded new profile picture',
    'System Update': 'System was updated to latest version',
    'Configuration Change': 'System configuration was modified',
    'Backup Created': 'System backup was created successfully',
    'Cache Cleared': 'System cache was cleared',
    'Settings Updated': 'System settings were updated',
    'Failed Login': 'Failed login attempt detected',
    'Password Reset': 'User requested password reset',
    'Account Locked': 'User account was locked due to multiple failed attempts',
    'Suspicious Activity': 'Suspicious activity detected on user account',
    'Access Denied': 'Access to restricted resource was denied',
    'User Management': 'Administrator performed user management action',
    'Permission Change': 'User permissions were modified',
    'System Settings': 'System settings were modified by administrator',
    'Logs Viewed': 'Activity logs were accessed',
    'Data Export': 'System data was exported'
  };

  const statuses = ['success', 'error', 'warning'];
  const roles = ['SUPER_ADMIN', 'ADMIN', 'USER'];
  
  const logs = [];
  
  // Generate 500 mock logs for export
  for (let i = 0; i < 500; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const categoryActions = actions[category as keyof typeof actions];
    const action = categoryActions[Math.floor(Math.random() * categoryActions.length)];
    
    const log = {
      id: `log_${i + 1}`,
      action,
      description: descriptions[action as keyof typeof descriptions],
      userId: `user_${Math.floor(Math.random() * 100)}`,
      userName: ['Admin User', 'John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'][Math.floor(Math.random() * 5)],
      userEmail: ['admin@example.com', 'john@example.com', 'jane@example.com', 'bob@example.com', 'alice@example.com'][Math.floor(Math.random() * 5)],
      userRole: roles[Math.floor(Math.random() * roles.length)],
      ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)] as 'success' | 'error' | 'warning',
      category,
      metadata: {
        browser: 'Chrome',
        os: 'Windows 10',
        device: 'Desktop'
      }
    };
    
    // Apply filters
    if (filters.category && log.category !== filters.category) continue;
    if (filters.status && log.status !== filters.status) continue;
    if (filters.userRole && log.userRole !== filters.userRole) continue;
    if (filters.search && !(
      log.action.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.userName.toLowerCase().includes(filters.search.toLowerCase())
    )) continue;
    
    logs.push(log);
  }
  
  return logs;
};

function convertToCSV(logs: any[]) {
  const headers = [
    'ID',
    'Timestamp',
    'Action',
    'Description',
    'User Name',
    'User Email',
    'User Role',
    'Category',
    'Status',
    'IP Address',
    'User Agent'
  ];
  
  const csvRows = [
    headers.join(','),
    ...logs.map(log => [
      log.id,
      `"${new Date(log.timestamp).toLocaleString()}"`,
      `"${log.action}"`,
      `"${log.description}"`,
      `"${log.userName}"`,
      `"${log.userEmail}"`,
      `"${log.userRole}"`,
      `"${log.category}"`,
      `"${log.status}"`,
      `"${log.ipAddress}"`,
      `"${log.userAgent}"`
    ].join(','))
  ];
  
  return csvRows.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      status: searchParams.get('status') || '',
      userRole: searchParams.get('userRole') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || ''
    };

    // Generate mock logs for export
    const logs = generateMockLogsForExport(filters);
    
    // Convert to CSV
    const csvContent = convertToCSV(logs);
    
    // Create CSV file
    const csvBuffer = Buffer.from(csvContent, 'utf-8');
    
    // Return CSV file
    return new NextResponse(csvBuffer, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
    
  } catch (error) {
    console.error('Error exporting logs:', error);
    return NextResponse.json(
      { error: 'Failed to export logs' },
      { status: 500 }
    );
  }
}