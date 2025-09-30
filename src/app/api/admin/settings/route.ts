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

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Return default settings (in production, you'd fetch from database or config file)
    const settings = {
      general: {
        siteName: "Clash of Clans Tournament Platform",
        siteDescription: "Professional tournament management platform",
        adminEmail: "admin@example.com",
        timezone: "UTC",
        language: "en",
        maintenanceMode: false,
      },
      security: {
        requireEmailVerification: true,
        twoFactorAuth: false,
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        passwordExpiry: 90,
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        adminAlerts: true,
        tournamentUpdates: true,
        userRegistration: true,
      },
      performance: {
        cacheEnabled: true,
        cacheTimeout: 300,
        maxUploadSize: 10,
        compressionEnabled: true,
        logLevel: "info",
      },
    };

    return NextResponse.json({
      message: 'Settings retrieved successfully',
      settings,
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const settings = await request.json();

    // Validate settings structure
    const requiredSections = ['general', 'security', 'notifications', 'performance'];
    for (const section of requiredSections) {
      if (!settings[section]) {
        return NextResponse.json(
          { error: `Missing settings section: ${section}` },
          { status: 400 }
        );
      }
    }

    // In production, you would save these settings to a database or config file
    // For now, we'll just acknowledge the update
    console.log('Settings updated by:', user.email);
    console.log('New settings:', JSON.stringify(settings, null, 2));

    // Here you would typically:
    // 1. Save to database
    // 2. Update environment variables if needed
    // 3. Restart certain services if required
    // 4. Log the changes

    return NextResponse.json({
      message: 'Settings saved successfully',
      settings,
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}