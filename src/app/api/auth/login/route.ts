import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    //Validasi input sederhana sebelum dikirim ke BE
    if (!body.churchCode || !body.email || !body.password) {
      return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
    }

    const beResponse = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await beResponse.json();

    if (!beResponse.ok) {
      return NextResponse.json({ message: data.message }, { status: beResponse.status });
    }

    const response = NextResponse.json({ success: true }, { status: 200 });

    //Menyimpan token di HttpOnly Cookie agar aman dari XSS
    response.cookies.set({
      name: "coma_token",
      value: data.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, //1 Hari
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}