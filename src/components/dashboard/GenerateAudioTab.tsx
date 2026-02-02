import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Voice, Generation, VoiceType, parseQwenParams, LANGUAGES } from "@/types/voice";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2 } from "lucide-react";
import { ScriptInput } from "./generate-audio/ScriptInput";
import { VoiceSelector } from "./generate-audio/VoiceSelector";
import { ResultsSection, ResultsSectionRef } from "./generate-audio/ResultsSection";

interface GenerateAudioTabProps {
  selectedVoice: Voice | null;
  onVoiceChange: (voice: Voice | null) => void;
}

export function GenerateAudioTab({ selectedVoice, onVoiceChange }: GenerateAudioTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const resultsSectionRef = useRef<ResultsSectionRef>(null);

  const [text, setText] = useState("");
  const [language, setLanguage] = useState("auto");
  const [voiceId, setVoiceId] = useState(selectedVoice?.id || "");
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  // Update voice selection when selectedVoice prop changes
  useEffect(() => {
    if (selectedVoice) {
      setVoiceId(selectedVoice.id);
    }
  }, [selectedVoice]);

  // Fetch all available voices (user's + default)
  const { data: allVoices } = useQuery({
    queryKey: ["all-voices", user?.id],
    queryFn: async () => {
      const { data: userVoices, error: userError } = await supabase
        .from("voices")
        .select("*")
        .eq("user_id", user?.id);

      if (userError) throw userError;

      const { data: defaultVoices, error: defaultError } = await supabase
        .from("voices")
        .select("*")
        .is("user_id", null)
        .eq("type", "default");

      if (defaultError) throw defaultError;

      const combined = [...(userVoices || []), ...(defaultVoices || [])];
      return combined.map((voice) => ({
        ...voice,
        type: voice.type as VoiceType,
        qwen_params: parseQwenParams(voice.qwen_params),
      })) as Voice[];
    },
    enabled: !!user,
  });

  // Fetch recent generations
  const { data: recentGenerations } = useQuery({
    queryKey: ["recent-generations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generations")
        .select("*, voice:voices(*)")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map((gen) => ({
        ...gen,
        voice: gen.voice
          ? {
              ...gen.voice,
              type: gen.voice.type as VoiceType,
              qwen_params: parseQwenParams(gen.voice.qwen_params),
            }
          : undefined,
      })) as Generation[];
    },
    enabled: !!user,
  });

  // Generate audio mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!voiceId || !text.trim()) {
        throw new Error("Please select a voice and enter text");
      }

      const { data, error } = await supabase.functions.invoke("generate-audio", {
        body: {
          voice_id: voiceId,
          text: text.trim(),
          language,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recent-generations"] });
      setCurrentAudioUrl(data.audio_url);
      toast({ title: "Audio generated!", description: "Your audio is ready to play." });
      
      // Scroll to results section
      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView();
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate audio.",
        variant: "destructive",
      });
    },
  });

  const userVoices = allVoices?.filter((v) => v.user_id === user?.id) || [];
  const defaultVoices = allVoices?.filter((v) => v.user_id === null) || [];
  const currentVoice = allVoices?.find((v) => v.id === voiceId);

  const canGenerate = voiceId && text.trim().length > 0;

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left: Script input */}
      <div className="space-y-6">
        <ScriptInput
          text={text}
          onChange={setText}
          onClear={() => setText("")}
          maxLength={5000}
        />

        {/* Generate button - visible on mobile */}
        <div className="lg:hidden">
          <Button
            variant="glow"
            size="lg"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !canGenerate}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="h-5 w-5" />
            )}
            Generate audio
          </Button>
        </div>
      </div>

      {/* Right: Voice selector + Results */}
      <div className="space-y-8">
        {/* Top-right: Voice selector */}
        <div className="space-y-6">
          <VoiceSelector
            voiceId={voiceId}
            language={language}
            onVoiceChange={setVoiceId}
            onLanguageChange={setLanguage}
            userVoices={userVoices}
            defaultVoices={defaultVoices}
            selectedVoice={currentVoice}
          />

          {/* Generate button - desktop */}
          <div className="hidden lg:block">
            <Button
              variant="glow"
              size="lg"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || !canGenerate}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Wand2 className="h-5 w-5" />
              )}
              Generate audio
            </Button>
          </div>
        </div>

        {/* Bottom-right: Results */}
        <ResultsSection
          ref={resultsSectionRef}
          currentAudioUrl={currentAudioUrl}
          recentGenerations={recentGenerations || []}
          onSelectGeneration={setCurrentAudioUrl}
        />
      </div>
    </div>
  );
}
