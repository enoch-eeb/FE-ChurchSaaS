import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.churchName || !body.churchCode || !body.adminName || !body.adminEmail || !body.adminPassword) {
      return NextResponse.json({ message: "Semua kolom wajib diisi" }, { status: 400 });
    }

    const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:3000";
    const BE_URL = `${BASE_URL}/api/v1/auth/register`;

    const beResponse = await fetch(BE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await beResponse.json();

    if (!beResponse.ok) {
      return NextResponse.json({ message: data.message }, { status: beResponse.status });
    }

    return NextResponse.json({ 
      success: true, 
      message: data.message,
      data: data.data 
    }, { status: 201 });

  } catch (error: any) {
    console.error("ERROR PROXY REGISTER:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server internal" }, { status: 500 });
  }
}