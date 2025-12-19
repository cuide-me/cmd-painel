import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Em desenvolvimento - API Quality V2' });
}
