-- Create enum for voice types
CREATE TYPE public.voice_type AS ENUM ('cloned', 'designed', 'default');

-- Create voices table
CREATE TABLE public.voices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type voice_type NOT NULL DEFAULT 'cloned',
    source_model TEXT NOT NULL DEFAULT 'Qwen3-TTS-Base',
    description TEXT,
    language TEXT DEFAULT 'auto',
    reference_audio_url TEXT,
    qwen_params JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create generations table
CREATE TABLE public.generations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    voice_id UUID NOT NULL REFERENCES public.voices(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    language TEXT DEFAULT 'auto',
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for additional user data and generation counts
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    generation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_voices_updated_at
    BEFORE UPDATE ON public.voices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for voices
-- Anyone can view default voices (user_id IS NULL)
CREATE POLICY "Anyone can view default voices"
    ON public.voices FOR SELECT
    USING (user_id IS NULL);

-- Users can view their own voices
CREATE POLICY "Users can view their own voices"
    ON public.voices FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can create their own voices
CREATE POLICY "Users can create their own voices"
    ON public.voices FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own voices
CREATE POLICY "Users can update their own voices"
    ON public.voices FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can delete their own voices
CREATE POLICY "Users can delete their own voices"
    ON public.voices FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policies for generations
-- Users can view their own generations
CREATE POLICY "Users can view their own generations"
    ON public.generations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can create their own generations
CREATE POLICY "Users can create their own generations"
    ON public.generations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own generations
CREATE POLICY "Users can delete their own generations"
    ON public.generations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_voices_user_id ON public.voices(user_id);
CREATE INDEX idx_voices_type ON public.voices(type);
CREATE INDEX idx_generations_user_id ON public.generations(user_id);
CREATE INDEX idx_generations_voice_id ON public.generations(voice_id);
CREATE INDEX idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- Seed default voices
INSERT INTO public.voices (user_id, name, type, source_model, description, language, qwen_params) VALUES
    (NULL, 'Nova', 'default', 'Qwen3-TTS-CustomVoice', 'Warm female narrator – Perfect for audiobooks, documentaries, and storytelling. Smooth, engaging, and naturally expressive.', 'en', '{"task_type": "CustomVoice", "speaker": "Nova"}'),
    (NULL, 'Kofi', 'default', 'Qwen3-TTS-CustomVoice', 'Calm male storyteller – African accent. Ideal for podcasts, meditation content, and thoughtful narration.', 'en', '{"task_type": "CustomVoice", "speaker": "Kofi"}'),
    (NULL, 'Aya', 'default', 'Qwen3-TTS-CustomVoice', 'Energetic female host – Multilingual. Great for marketing content, explainer videos, and dynamic presentations.', 'auto', '{"task_type": "CustomVoice", "speaker": "Aya"}'),
    (NULL, 'Marcus', 'default', 'Qwen3-TTS-CustomVoice', 'Deep authoritative male – American accent. Suited for trailers, announcements, and professional voiceovers.', 'en', '{"task_type": "CustomVoice", "speaker": "Marcus"}'),
    (NULL, 'Mei', 'default', 'Qwen3-TTS-CustomVoice', 'Soft-spoken female – Native Chinese speaker. Perfect for e-learning, ASMR, and gentle guided content.', 'zh', '{"task_type": "CustomVoice", "speaker": "Mei"}'),
    (NULL, 'Carlos', 'default', 'Qwen3-TTS-CustomVoice', 'Friendly male conversationalist – Spanish accent. Excellent for casual content, tutorials, and social media.', 'es', '{"task_type": "CustomVoice", "speaker": "Carlos"}');

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', true);

-- Storage policies for audio bucket
CREATE POLICY "Anyone can view audio files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'audio');

CREATE POLICY "Authenticated users can upload audio"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'audio');

CREATE POLICY "Users can update their own audio"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);