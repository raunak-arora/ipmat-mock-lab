import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({
    clientIdSet: !!process.env.GOOGLE_CLIENT_ID,
    clientIdLength: process.env.GOOGLE_CLIENT_ID?.length,
    clientIdStart: process.env.GOOGLE_CLIENT_ID?.substring(0, 20),
    clientIdEnd: process.env.GOOGLE_CLIENT_ID?.slice(-30),
    secretSet: !!process.env.GOOGLE_CLIENT_SECRET,
  });
}
