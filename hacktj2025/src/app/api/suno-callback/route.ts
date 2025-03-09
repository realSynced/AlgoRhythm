import { NextResponse } from "next/server";

// This API route handles callbacks from the Suno API
// The Suno API will send updates about generation status to this endpoint

export async function POST(request: Request) {
  try {
    console.log("Received callback request:", request);
    // Parse the incoming JSON data
    const data = await request.json();

    // Log the callback data for debugging
    console.log("Received Suno API callback:", data);

    // Here you could store the data in a database or trigger other actions
    // For now, we'll just acknowledge receipt

    // Return a success response
    return NextResponse.json({
      success: true,
      message: "Callback received successfully",
    });
  } catch (error) {
    console.error("Error processing Suno callback:", error);

    // Return an error response
    return NextResponse.json(
      { success: false, error: "Failed to process callback" },
      { status: 500 }
    );
  }
}

// Also handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    status: "online",
    message: "Suno callback endpoint is active",
  });
}
