import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.churchCode || !body.email || !body.password) {
      return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
    }

    const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:3000";
    const BE_URL = `${BASE_URL}/api/v1/auth/login`;

    const beResponse = await fetch(BE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await beResponse.json();

    if (!beResponse.ok) {
      return NextResponse.json({ message: data.message || "Kredensial tidak valid" }, { status: beResponse.status });
    }

    const response = NextResponse.json({ success: true, data: data }, { status: 200 });

    response.cookies.set({
      name: "coma_token",
      value: data.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("ERROR PROXY LOGIN:", error);
    return NextResponse.json({ message: "Terjadi kesalahan koneksi ke server" }, { status: 500 });
  }
}