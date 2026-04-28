import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: "Berhasil logout" },
      { status: 200 }
    );

    //Hapus cookie dengan set value kosong dan maxAge 0
    response.cookies.set({
      name: "coma_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      expires: new Date(0), // Memastikan expired di masa lalu
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("ERROR LOGOUT:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat logout" },
      { status: 500 }
    );
  }
}