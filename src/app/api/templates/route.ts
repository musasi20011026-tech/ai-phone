import { NextResponse } from 'next/server';
import { getTemplatesByCategory } from '@/lib/templates';

export async function GET() {
  return NextResponse.json(getTemplatesByCategory());
}
