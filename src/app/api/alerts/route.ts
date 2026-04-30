import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("coma_token")?.value;
        const searchParams = req.nextUrl.search;

        const res = await fetch(`${BASE_URL}/api/v1/alerts${searchParams}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}