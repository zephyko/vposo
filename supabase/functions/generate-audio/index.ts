// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowed languages for validation
const ALLOWED_LANGUAGES = ['auto', 'en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'ru', 'ar'] as const;

// Input validation schema
const RequestSchema = z.object({
  voice_id: z.string().uuid('Invalid voice ID format'),
  text: z.string()
    .min(1, 'Text cannot be empty')
    .max(5000, 'Text exceeds maximum length of 5000 characters')
    .trim()
    .refine(text => text.length > 0, 'Text cannot be only whitespace'),
  language: z.enum(ALLOWED_LANGUAGES).optional().default('auto'),
});

// =============================================================================
// TODO: QWEN3-TTS INTEGRATION
// =============================================================================
// Replace this placeholder URL with your actual Qwen3-TTS API endpoint.
// This could be:
// - Wavespeed API: https://api.wavespeed.ai/v1/tts
// - Alibaba Qwen API: Your Alibaba Cloud endpoint
// - Self-hosted vLLM instance: http://your-server:8000/v1/tts
//
// Required environment variables:
// - QWEN_API_URL: The Qwen3-TTS API endpoint
// - QWEN_API_KEY: Your API key for authentication
// =============================================================================

// Qwen3-TTS API configuration
// The API follows the OpenAI Audio Speech API format at /v1/audio/speech
const QWEN_API_URL = Deno.env.get("QWEN_API_URL") || "";
const QWEN_API_KEY = Deno.env.get("QWEN_API_KEY") || "";

interface QwenTTSRequest {
  task_type: "Base" | "CustomVoice" | "VoiceDesign";
  text: string;
  language: string;
  reference_audio_url?: string;
  voice_description?: string;
  speaker?: string;
}

interface QwenTTSResponse {
  audio_url: string;
  file_path: string;
  duration?: number;
}

// Map our language codes to Qwen3-TTS language format
function mapLanguage(lang: string): string {
  const languageMap: Record<string, string> = {
    "auto": "Auto",
    "en": "English",
    "zh": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "es": "English", // Fallback for unsupported languages
    "fr": "English",
    "de": "English",
    "pt": "English",
    "ru": "English",
    "ar": "English",
  };
  return languageMap[lang] || "Auto";
}

/**
 * Calls the Qwen3-TTS API to generate audio.
 * Uses the OpenAI-compatible /v1/audio/speech endpoint.
 */
async function callQwenTTS(request: QwenTTSRequest): Promise<QwenTTSResponse> {
  console.log("[Qwen TTS] Generating audio with params:", JSON.stringify(request));

  if (!QWEN_API_URL) {
    throw new Error("QWEN_API_URL is not configured. Please set it in your secrets.");
  }

  // Build the API endpoint
  // Handle various URL formats:
  // - Full endpoint: https://api.example.com/v1/audio/speech
  // - Base with /v1: https://api.example.com/compatible-mode/v1
  // - Base URL only: https://api.example.com
  let apiEndpoint: string;
  const normalizedUrl = QWEN_API_URL.replace(/\/$/, "");
  
  if (normalizedUrl.endsWith("/v1/audio/speech")) {
    apiEndpoint = normalizedUrl;
  } else if (normalizedUrl.endsWith("/v1")) {
    apiEndpoint = `${normalizedUrl}/audio/speech`;
  } else {
    apiEndpoint = `${normalizedUrl}/v1/audio/speech`;
  }

  // Build request body based on task type
  const body: Record<string, unknown> = {
    input: request.text,
    response_format: "mp3",
    task_type: request.task_type,
    language: mapLanguage(request.language),
    max_new_tokens: 4096,
  };

  // Add task-specific parameters
  switch (request.task_type) {
    case "CustomVoice":
      // Use predefined speaker voice
      body.voice = request.speaker || "Vivian";
      if (request.voice_description) {
        body.instructions = request.voice_description;
      }
      break;

    case "VoiceDesign":
      // Use natural language voice description
      body.voice = "default";
      if (request.voice_description) {
        body.instructions = request.voice_description;
      }
      break;

    case "Base":
      // Voice cloning from reference audio
      if (request.reference_audio_url) {
        body.ref_audio = request.reference_audio_url;
      }
      body.voice = "clone";
      break;
  }

  console.log("[Qwen TTS] Calling API:", apiEndpoint);
  console.log("[Qwen TTS] Request body:", JSON.stringify(body));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authorization if API key is provided
  if (QWEN_API_KEY) {
    headers["Authorization"] = `Bearer ${QWEN_API_KEY}`;
  }

  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Qwen TTS] API error:", response.status, errorText);
    throw new Error(`Qwen TTS API error: ${response.status} - ${errorText}`);
  }

  // The API returns audio data directly, we need to upload it to storage
  const audioBuffer = await response.arrayBuffer();
  console.log("[Qwen TTS] Received audio data, size:", audioBuffer.byteLength, "bytes");

  // Upload the audio to Supabase storage using service role (for generated/ folder)
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  // Create service role client for storage operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  const fileName = `generated/${crypto.randomUUID()}.mp3`;
  
  // Upload file using Supabase SDK
  const { error: uploadError } = await supabaseAdmin.storage
    .from('audio')
    .upload(fileName, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: false,
    });

  if (uploadError) {
    console.error("[Qwen TTS] Storage upload error:", uploadError);
    throw new Error(`Failed to upload audio: ${uploadError.message}`);
  }

  // Generate a signed URL (valid for 1 hour) since bucket is now private
  const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
    .from('audio')
    .createSignedUrl(fileName, 3600); // 1 hour expiry

  if (signedUrlError || !signedUrlData?.signedUrl) {
    console.error("[Qwen TTS] Failed to create signed URL:", signedUrlError);
    throw new Error(`Failed to create signed URL: ${signedUrlError?.message || 'Unknown error'}`);
  }

  console.log("[Qwen TTS] Audio uploaded successfully, signed URL generated");

  return {
    audio_url: signedUrlData.signedUrl,
    file_path: fileName, // Store file path for regenerating signed URLs later
    duration: Math.ceil(audioBuffer.byteLength / 16000), // Rough estimate
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validation = RequestSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Generate Audio] Validation failed:", validation.error.issues);
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          details: validation.error.issues.map(i => i.message) 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { voice_id, text, language } = validation.data;
    console.log(`[Generate Audio] User ${user.id} generating audio for voice ${voice_id}`);

    // =========================================================================
    // QUOTA CHECK: Verify user hasn't exceeded daily generation limit
    // =========================================================================
    
    // Get user's profile with daily limit
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("daily_generation_limit")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[Generate Audio] Failed to fetch profile:", profileError);
      return new Response(JSON.stringify({ error: "Failed to verify quota" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dailyLimit = profile?.daily_generation_limit ?? 20;
    
    // Count generations in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count: todayCount, error: countError } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", twentyFourHoursAgo);

    if (countError) {
      console.error("[Generate Audio] Failed to count generations:", countError);
      return new Response(JSON.stringify({ error: "Failed to verify quota" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usedCount = todayCount ?? 0;
    console.log(`[Generate Audio] User ${user.id} has used ${usedCount}/${dailyLimit} generations today`);

    if (usedCount >= dailyLimit) {
      console.log(`[Generate Audio] User ${user.id} has reached daily limit`);
      return new Response(
        JSON.stringify({ 
          error: "quota_exceeded",
          message: "You've reached your daily generation limit. Upgrade your plan to generate more audio.",
          usage: { used: usedCount, limit: dailyLimit }
        }), 
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =========================================================================
    // VOICE FETCH & ACCESS CHECK
    // =========================================================================

    // Fetch the voice from the database
    const { data: voice, error: voiceError } = await supabase
      .from("voices")
      .select("*")
      .eq("id", voice_id)
      .single();

    if (voiceError || !voice) {
      console.error("[Generate Audio] Voice not found:", voiceError);
      return new Response(JSON.stringify({ error: "Voice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has access to this voice (own voice or default voice)
    if (voice.user_id !== null && voice.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Access denied to this voice" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract Qwen parameters from the voice
    const qwenParams = voice.qwen_params as Record<string, unknown> || {};
    const taskType = (qwenParams.task_type as string) || "Base";

    // Construct the Qwen TTS request based on voice type
    const ttsRequest: QwenTTSRequest = {
      task_type: taskType as QwenTTSRequest["task_type"],
      text,
      language: language || voice.language || "auto",
    };

    // Add voice-specific parameters
    switch (voice.type) {
      case "cloned":
        // Cloned voices use reference audio
        if (voice.reference_audio_url) {
          ttsRequest.reference_audio_url = voice.reference_audio_url;
        }
        break;

      case "designed":
        // Designed voices use voice description
        if (qwenParams.voice_description) {
          ttsRequest.voice_description = qwenParams.voice_description as string;
        }
        break;

      case "default":
        // Default voices use speaker name
        if (qwenParams.speaker) {
          ttsRequest.speaker = qwenParams.speaker as string;
        }
        break;
    }

    // Call Qwen TTS API
    const ttsResponse = await callQwenTTS(ttsRequest);

    // Save the generation to the database
    const { data: generation, error: genError } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        voice_id: voice_id,
        text: text,
        language: language || "auto",
        audio_url: ttsResponse.audio_url,
      })
      .select()
      .single();

    if (genError) {
      console.error("[Generate Audio] Failed to save generation:", genError);
      // Don't fail the request, just log the error
    }

    // Update user's generation count
    const { error: rpcError } = await supabase.rpc("increment_generation_count", {
      p_user_id: user.id,
    });

    if (rpcError) {
      console.log("[Generate Audio] Failed to update generation count (function may not exist):", rpcError.message);
      // This is not critical, continue without failing
    }

    console.log(`[Generate Audio] Successfully generated audio for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        audio_url: ttsResponse.audio_url,
        generation_id: generation?.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("[Generate Audio] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
