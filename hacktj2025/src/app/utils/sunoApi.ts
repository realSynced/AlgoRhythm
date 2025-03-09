// Utility functions for interacting with the Suno API

interface SunoGenerationOptions {
  prompt: string;
  style?: string;
  title?: string;
  customMode?: boolean;
  instrumental?: boolean;
  model?: string;
  callBackUrl?: string;
}

interface SunoResponse {
  id: string;
  status: string;
  url?: string;
  error?: string;
}

// Environment variable for the API token should be set in .env.local
// NEXT_PUBLIC_SUNO_API_TOKEN=your_token_here

export async function generateVocalsWithSuno(
  lyrics: string,
  options: Partial<SunoGenerationOptions> = {}
): Promise<SunoResponse> {
  try {
    // Get API token from environment or use a placeholder
    const apiToken = process.env.NEXT_PUBLIC_SUNO_API_TOKEN || "";

    if (!apiToken) {
      console.warn(
        "No Suno API token found. Set NEXT_PUBLIC_SUNO_API_TOKEN in your .env.local file"
      );
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Authorization", `Bearer ${apiToken}`);

    // Combine lyrics with any additional options
    const requestBody: SunoGenerationOptions = {
      prompt: lyrics,
      style: options.style || "Pop",
      title: options.title || "Generated Vocals",
      customMode: options.customMode !== undefined ? options.customMode : true,
      instrumental:
        options.instrumental !== undefined ? options.instrumental : false,
      model: options.model || "V3_5",
      // Always include a callBackUrl - required by the API
      // Use a local endpoint during development, or the production URL in production
      callBackUrl: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/api/suno-callback'
        : 'https://algorhythm-hacktj.vercel.app/api/suno-callback',
    };

    console.log("Sending request to Suno API:", requestBody);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(requestBody),
      redirect: "follow" as RequestRedirect,
    };

    const response = await fetch(
      "https://apibox.erweima.ai/api/v1/generate",
      requestOptions
    );

    const result = await response.json();
    console.log("Generation API response:", result);

    if (!response.ok) {
      console.error("API error response:", result);
      throw new Error(
        result.msg || `API request failed with status ${response.status}`
      );
    }

    // Handle the actual API response structure
    if (result.code === 200 && result.data?.taskId) {
      return {
        id: result.data.taskId,
        status: "started"
      };
    } else {
      throw new Error(result.msg || "Failed to get valid task ID from API");
    }
  } catch (error) {
    console.error("Error generating vocals:", error);
    return {
      id: "",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Poll for the status of a generation
export async function checkGenerationStatus(
  generationId: string
): Promise<SunoResponse> {
  try {
    const apiToken = process.env.NEXT_PUBLIC_SUNO_API_TOKEN || "";

    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${apiToken}`);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow" as RequestRedirect,
    };

    console.log(`Checking status for generation ID: ${generationId}`);

    // Try using the generations endpoint instead of tasks
    const response = await fetch(
      `https://apibox.erweima.ai/api/v1/generations/${generationId}`,
      requestOptions
    );

    // Log the raw response for debugging
    console.log("Status check raw response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()])
    });

    const result = await response.json();
    console.log("Status check response body:", result);

    if (!response.ok) {
      console.error("Status check error:", response.status, response.statusText, result);
      throw new Error(result.msg || `Status check failed with status ${response.status}`);
    }

    // Map the API response to our SunoResponse interface based on actual API structure
    if (result.code === 200 && result.data) {
      return {
        id: generationId,
        status: result.data.status || "processing",
        url: result.data.url || undefined,
        error: undefined
      };
    } else if (result.status) {
      // Alternative API response format
      return {
        id: generationId,
        status: result.status,
        url: result.url || undefined,
        error: result.error || undefined
      };
    } else {
      return {
        id: generationId,
        status: "error",
        error: result.msg || "Invalid response format"
      };
    }
  } catch (error) {
    console.error("Error checking generation status:", error);
    return {
      id: generationId,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
