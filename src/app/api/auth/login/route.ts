import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.churchCode || !body.email || !body.password) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:3000";
    const BE_URL = `${BASE_URL}/api/v1/auth/login`;

    const beResponse = await fetch(BE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    //Cek jika BE mengembalikan HTML (error 404/500 biasanya)
    const contentType = beResponse.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      return NextResponse.json({ success: false, message: "Backend server error (HTML response)" }, { status: 500 });
    }

    const data = await beResponse.json();

    if (!beResponse.ok) {
      return NextResponse.json(
        { success: false, message: data.message || "Kredensial tidak valid" }, 
        { status: beResponse.status }
      );
    }

    //Ambil token dari struktur data yang baru
    const token = data.token; 
    if (!token) {
      return NextResponse.json({ success: false, message: "Token tidak diterima dari server" }, { status: 500 });
    }

    const response = NextResponse.json({ success: true, data: data }, { status: 200 });

    //Set Cookie
    response.cookies.set({
      name: "coma_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 hari
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("ERROR PROXY LOGIN:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan koneksi ke server" }, { status: 500 });
  }
}