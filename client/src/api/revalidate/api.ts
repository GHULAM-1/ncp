import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Simple revalidation API - can be called by cron job to trigger ISR updates
export async function POST(request: NextRequest) {
  try {
    // Verify the request (you can add authentication here)
    const body = await request.json();
    const { secret, path } = body;

    // Check for the secret to confirm this is a valid request
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Revalidate the specified path or main page by default
    const targetPath = path || '/';
    revalidatePath(targetPath);

    return NextResponse.json({ 
      revalidated: true, 
      path: targetPath,
      now: Date.now(),
      message: `Path ${targetPath} revalidated successfully`
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error revalidating',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method for manual revalidation (useful for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';
    
    // Revalidate the specified path
    revalidatePath(path);
    
    return NextResponse.json({ 
      revalidated: true, 
      path,
      now: Date.now(),
      message: `Path ${path} revalidated successfully`
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error revalidating',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 