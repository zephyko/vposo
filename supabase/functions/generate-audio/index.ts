// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

const QWEN_API_URL = Deno.env.get("QWEN_API_URL") || "https://placeholder-qwen-api.example.com/v1/tts";
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
  duration?: number;
}

/**
 * Calls the Qwen3-TTS API to generate audio.
 * 
 * TODO: Implement this function with your actual Qwen3-TTS API.
 * 
 * The function should:
 * 1. Construct the appropriate request based on task_type
 * 2. Call the Qwen3-TTS API
 * 3. Return the generated audio URL
 * 
 * For now, this returns a mock audio URL.
 */
async function callQwenTTS(request: QwenTTSRequest): Promise<QwenTTSResponse> {
  console.log("[Qwen TTS] Generating audio with params:", JSON.stringify(request));

  // =============================================================================
  // TODO: REPLACE THIS MOCK WITH ACTUAL API CALL
  // =============================================================================
  // Example implementation for a real API:
  //
  // const response = await fetch(QWEN_API_URL, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Authorization": `Bearer ${QWEN_API_KEY}`,
  //   },
  //   body: JSON.stringify({
  //     task_type: request.task_type,
  //     text: request.text,
  //     language: request.language,
  //     // For Base/CustomVoice tasks with cloned voices:
  //     reference_audio_url: request.reference_audio_url,
  //     // For VoiceDesign tasks:
  //     voice_description: request.voice_description,
  //     // For CustomVoice with predefined speakers:
  //     speaker: request.speaker,
  //   }),
  // });
  //
  // if (!response.ok) {
  //   const error = await response.text();
  //   throw new Error(`Qwen TTS API error: ${response.status} - ${error}`);
  // }
  //
  // const data = await response.json();
  // return {
  //   audio_url: data.audio_url,
  //   duration: data.duration,
  // };
  // =============================================================================

  // Mock response - returns a sample audio file URL
  // This simulates a successful API response
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API latency

  // Using a placeholder audio URL (you can replace with any public audio file for testing)
  const mockAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  
  console.log("[Qwen TTS] Mock generation complete, returning:", mockAudioUrl);
  
  return {
    audio_url: mockAudioUrl,
    duration: 30, // Mock duration in seconds
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

    // Parse request body
    const { voice_id, text, language } = await req.json();

    if (!voice_id || !text) {
      return new Response(JSON.stringify({ error: "Missing voice_id or text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Generate Audio] User ${user.id} generating audio for voice ${voice_id}`);

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
    const { error: countError } = await supabase.rpc("increment_generation_count", {
      p_user_id: user.id,
    });

    if (countError) {
      console.log("[Generate Audio] Failed to update generation count (function may not exist):", countError.message);
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
