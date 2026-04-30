import { NextResponse } from 'next/server';
import { trackUsage } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { toolName, action, metadata } = await request.json();
    
    if (!toolName || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await trackUsage(toolName, action, metadata || {});
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
