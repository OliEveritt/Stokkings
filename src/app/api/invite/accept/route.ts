import { NextResponse } from 'next/server';
import { InvitationService } from '@/services/invitation.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Basic structural validation
    if (!body.token || !body.userId || !body.groupId) {
      return NextResponse.json({ error: "Missing required handshake data" }, { status: 400 });
    }

    const result = await InvitationService.acceptInvitation(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Handshake Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}