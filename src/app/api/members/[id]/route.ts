import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:3000";
const BE_URL = `${BASE_URL}/api/v1/members`;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const cookieStore = await cookies();
    
    const token = cookieStore.get("coma_token")?.value;

    const res = await fetch(`${BE_URL}/${id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      return NextResponse.json({ success: false, message: "Backend Endpoint salah" }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("ERROR PROXY PUT MEMBER:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error FE" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("coma_token")?.value;

    const res = await fetch(`${BE_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      return NextResponse.json({ success: false, message: "Backend Endpoint salah" }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("ERROR PROXY DELETE MEMBER:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error FE" }, { status: 500 });
  }
}