import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";

function getPasswordHash(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_CHAT_PASSWORD || "admin";

    if (password === adminPassword) {
      const sessionToken = getPasswordHash(adminPassword);
      const cookieStore = await cookies();
      
      cookieStore.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
        sameSite: "strict",
      });

      return NextResponse.json({ success: true, message: "Authenticated successfully" });
    }

    return NextResponse.json({ success: false, message: "Invalid password" }, { status: 401 });
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("admin_session");
    const adminPassword = process.env.ADMIN_CHAT_PASSWORD || "admin";
    const expectedToken = getPasswordHash(adminPassword);

    if (sessionCookie && sessionCookie.value === expectedToken) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    console.error("Check auth error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
