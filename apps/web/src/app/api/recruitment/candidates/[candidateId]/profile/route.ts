import { NextRequest, NextResponse } from 'next/server';

const AI_RECRUITMENT_SERVICE_URL = process.env.AI_RECRUITMENT_SERVICE_URL || 'http://localhost:8002';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;
    
    const response = await fetch(`${AI_RECRUITMENT_SERVICE_URL}/api/recruitment/candidates/${candidateId}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `AI service error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to AI recruitment service:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with AI recruitment service' },
      { status: 500 }
    );
  }
}