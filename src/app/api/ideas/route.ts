import { NextResponse } from 'next/server';
import { projectService } from '@/services/ProjectService';

export async function GET() {
  try {
    const ideas = projectService.getIdeas();
    return NextResponse.json(ideas);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
