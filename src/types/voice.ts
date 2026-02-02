import { Json } from "@/integrations/supabase/types";

export type VoiceType = 'cloned' | 'designed' | 'default';

export interface QwenParams {
  task_type: 'Base' | 'CustomVoice' | 'VoiceDesign';
  speaker?: string;
  voice_description?: string;
}

export interface Voice {
  id: string;
  user_id: string | null;
  name: string;
  type: VoiceType;
  source_model: string;
  description: string | null;
  language: string;
  reference_audio_url: string | null;
  qwen_params: QwenParams;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  voice_id: string;
  text: string;
  language: string;
  audio_url: string | null;
  created_at: string;
  voice?: Voice;
}

export interface Profile {
  id: string;
  user_id: string;
  generation_count: number;
  created_at: string;
  updated_at: string;
}

export const LANGUAGES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: 'Chinese' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ar', label: 'Arabic' },
] as const;

// Helper function to safely cast JSON to QwenParams
export function parseQwenParams(json: Json | null): QwenParams {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { task_type: 'Base' };
  }
  const obj = json as Record<string, unknown>;
  return {
    task_type: (obj.task_type as QwenParams['task_type']) || 'Base',
    speaker: obj.speaker as string | undefined,
    voice_description: obj.voice_description as string | undefined,
  };
}
