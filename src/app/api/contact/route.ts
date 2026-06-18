import { NextResponse } from "next/server";
import { z } from "zod";
import { saveContactMessage } from "@/lib/firebase";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate body parameters with Zod
    const validatedData = contactSchema.parse(body);

    // Write database entry (Firestore or local fallback)
    const result = await saveContactMessage(validatedData);

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully!",
      destination: result.destination,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          errors: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.error("Submission handler error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected server error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}
