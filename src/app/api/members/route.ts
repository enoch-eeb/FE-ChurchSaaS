import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:3000";
const BE_URL = `${BASE_URL}/api/v1/members`;

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("coma_token")?.value;
    const searchParams = req.nextUrl.search;

    const res = await fetch(`${BE_URL}${searchParams}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      console.error("DEBUG BE: Rute GET tidak ditemukan di Backend (404)");
      return NextResponse.json({ success: false, message: "Backend Endpoint salah" }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("ERROR PROXY GET MEMBERS:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error FE" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get("coma_token")?.value;

    const res = await fetch(BE_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      console.error("DEBUG BE: Rute POST tidak ditemukan di Backend (404)");
      return NextResponse.json({ success: false, message: "Backend Endpoint salah" }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("ERROR PROXY POST MEMBERS:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error FE" }, { status: 500 });
  }
}