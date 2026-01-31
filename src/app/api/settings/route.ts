// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User, { UserRegion, CreditTier, CREDIT_TIER_CONFIG } from '@/lib/models/User';
import { formatPhoneNumber, isValidPhoneNumber, sendTestSms, isSmsConfigured } from '@/lib/sms';

const VALID_REGIONS: UserRegion[] = ['US', 'EU', 'UK', 'AU'];
const VALID_CREDIT_TIERS: CreditTier[] = ['20k', '100k', '5m', '15m'];

// GET - Fetch user settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findById((session.user as { id: string }).id).select(
      'oddsApiKey plan subscriptionStatus subscriptionEndsAt region phoneNumber phoneVerified autoScan'
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const res = NextResponse.json({
      oddsApiKey: user.oddsApiKey || '',
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt,
      region: user.region || 'AU',
      phoneNumber: user.phoneNumber || '',
      phoneVerified: user.phoneVerified || false,
      autoScan: {
        enabled: user.autoScan?.enabled || false,
        minProfitPercent: user.autoScan?.minProfitPercent || 4.0,
        highValueThreshold: user.autoScan?.highValueThreshold || 10.0,
        enableHighValueReminders: user.autoScan?.enableHighValueReminders !== false,
        regions: user.autoScan?.regions || ['AU'],
        creditTier: user.autoScan?.creditTier || '20k',
        alertCooldownMinutes: user.autoScan?.alertCooldownMinutes || 5,
        lastScanAt: user.autoScan?.lastScanAt,
        creditsUsedThisMonth: user.autoScan?.creditsUsedThisMonth || 0,
      },
      smsConfigured: isSmsConfigured(),
      creditTierOptions: Object.entries(CREDIT_TIER_CONFIG).map(([key, config]) => ({
        value: key,
        label: config.label,
        scanInterval: formatScanInterval(config.scanIntervalSeconds),
      })),
    });
    
    res.headers.set('Cache-Control', 'private, max-age=10');
    return res;
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      oddsApiKey, 
      region, 
      phoneNumber,
      autoScan,
      sendTestMessage,
    } = body;

    await dbConnect();
    
    const userId = (session.user as { id: string }).id;
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    
    // Handle API key update
    if (oddsApiKey !== undefined) {
      updateData.oddsApiKey = oddsApiKey || '';
    }
    
    // Handle region update
    if (region !== undefined && VALID_REGIONS.includes(region)) {
      updateData.region = region;
    }
    
    // Handle phone number update
    if (phoneNumber !== undefined) {
      if (phoneNumber === '') {
        updateData.phoneNumber = '';
        updateData.phoneVerified = false;
      } else {
        const formattedPhone = formatPhoneNumber(phoneNumber);
        if (!isValidPhoneNumber(formattedPhone)) {
          return NextResponse.json(
            { error: 'Invalid phone number format. Please include country code (e.g., +61412345678)' },
            { status: 400 }
          );
        }
        
        // Only update if phone changed
        if (formattedPhone !== user.phoneNumber) {
          updateData.phoneNumber = formattedPhone;
          updateData.phoneVerified = false; // Reset verification when phone changes
        }
      }
    }
    
    // Handle auto-scan settings update
    if (autoScan !== undefined) {
      // Convert Mongoose subdocument to plain object
      const currentAutoScan = user.autoScan ? JSON.parse(JSON.stringify(user.autoScan)) : {};
      
      // Validate and merge auto-scan settings
      const newAutoScan = { ...currentAutoScan };
      
      if (typeof autoScan.enabled === 'boolean') {
        // Validate prerequisites before enabling
        if (autoScan.enabled) {
          const phoneToCheck = updateData.phoneNumber || user.phoneNumber;
          if (!phoneToCheck) {
            return NextResponse.json(
              { error: 'Phone number is required to enable auto-scan alerts' },
              { status: 400 }
            );
          }
          if (!user.oddsApiKey && !updateData.oddsApiKey) {
            return NextResponse.json(
              { error: 'API key is required to enable auto-scan alerts' },
              { status: 400 }
            );
          }
          if (!isSmsConfigured()) {
            return NextResponse.json(
              { error: 'SMS service is not configured. Please contact support.' },
              { status: 400 }
            );
          }
        }
        newAutoScan.enabled = autoScan.enabled;
      }
      
      if (typeof autoScan.minProfitPercent === 'number') {
        if (autoScan.minProfitPercent < 4 || autoScan.minProfitPercent > 500) {
          return NextResponse.json(
            { error: 'Minimum profit must be between 4% and 500%' },
            { status: 400 }
          );
        }
        newAutoScan.minProfitPercent = autoScan.minProfitPercent;
      }
      
      if (typeof autoScan.highValueThreshold === 'number') {
        if (autoScan.highValueThreshold < 5 || autoScan.highValueThreshold > 500) {
          return NextResponse.json(
            { error: 'High-value threshold must be between 5% and 500%' },
            { status: 400 }
          );
        }
        newAutoScan.highValueThreshold = autoScan.highValueThreshold;
      }
      
      if (typeof autoScan.enableHighValueReminders === 'boolean') {
        newAutoScan.enableHighValueReminders = autoScan.enableHighValueReminders;
      }
      
      if (Array.isArray(autoScan.regions)) {
        const validRegions = autoScan.regions.filter((r: string) => VALID_REGIONS.includes(r as UserRegion));
        if (validRegions.length === 0) {
          return NextResponse.json(
            { error: 'At least one valid region is required' },
            { status: 400 }
          );
        }
        newAutoScan.regions = validRegions;
      }
      
      if (autoScan.creditTier !== undefined) {
        if (!VALID_CREDIT_TIERS.includes(autoScan.creditTier)) {
          return NextResponse.json(
            { error: 'Invalid credit tier' },
            { status: 400 }
          );
        }
        newAutoScan.creditTier = autoScan.creditTier;
      }
      
      if (typeof autoScan.alertCooldownMinutes === 'number') {
        if (autoScan.alertCooldownMinutes < 1 || autoScan.alertCooldownMinutes > 60) {
          return NextResponse.json(
            { error: 'Alert cooldown must be between 1 and 60 minutes' },
            { status: 400 }
          );
        }
        newAutoScan.alertCooldownMinutes = autoScan.alertCooldownMinutes;
      }
      
      // Initialize credits reset date if not set
      if (!newAutoScan.creditsResetAt) {
        const now = new Date();
        newAutoScan.creditsResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }
      
      updateData.autoScan = newAutoScan;
    }
    
    // Apply updates
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    // Handle test message request
    if (sendTestMessage && updatedUser?.phoneNumber) {
      const result = await sendTestSms(updatedUser.phoneNumber);
      if (result.success) {
        // Mark phone as verified after successful test
        await User.findByIdAndUpdate(userId, { phoneVerified: true });
        return NextResponse.json({
          message: 'Settings updated and test message sent',
          testMessageSent: true,
          phoneVerified: true,
        });
      } else {
        return NextResponse.json({
          message: 'Settings updated but test message failed',
          testMessageSent: false,
          testMessageError: result.error,
        });
      }
    }

    return NextResponse.json({
      message: 'Settings updated',
      oddsApiKey: updatedUser?.oddsApiKey,
      region: updatedUser?.region,
      phoneNumber: updatedUser?.phoneNumber,
      phoneVerified: updatedUser?.phoneVerified,
      autoScan: updatedUser?.autoScan ? JSON.parse(JSON.stringify(updatedUser.autoScan)) : undefined,
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// Helper to format scan interval for display
function formatScanInterval(seconds: number): string {
  if (seconds < 60) {
    return `Every ${seconds} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `Every ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.round(seconds / 3600);
    return `Every ${hours} hour${hours !== 1 ? 's' : ''}`;
  }
}