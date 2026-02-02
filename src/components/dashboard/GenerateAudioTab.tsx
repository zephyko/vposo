import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Voice, Generation, VoiceType, parseQwenParams, LANGUAGES } from "@/types/voice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Download, Loader2, Wand2, Volume2 } from "lucide-react";
import { format } from "date-fns";

interface GenerateAudioTabProps {
  selectedVoice: Voice | null;
  onVoiceChange: (voice: Voice | null) => void;
}

export function GenerateAudioTab({ selectedVoice, onVoiceChange }: GenerateAudioTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("auto");
  const [voiceId, setVoiceId] = useState(selectedVoice?.id || "");
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
      // Fetch user's voices
      const { data: userVoices, error: userError } = await supabase
        .from("voices")
        .select("*")
        .eq("user_id", user?.id);

      if (userError) throw userError;

      // Fetch default voices
      const { data: defaultVoices, error: defaultError } = await supabase
        .from("voices")
        .select("*")
        .is("user_id", null)
        .eq("type", "default");

      if (defaultError) throw defaultError;

      // Combine and transform
      const combined = [...(userVoices || []), ...(defaultVoices || [])];
      return combined.map(voice => ({
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
      
      return (data || []).map(gen => ({
        ...gen,
        voice: gen.voice ? {
          ...gen.voice,
          type: gen.voice.type as VoiceType,
          qwen_params: parseQwenParams(gen.voice.qwen_params),
        } : undefined,
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
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate audio.",
        variant: "destructive",
      });
    },
  });

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (currentAudioUrl) {
      const a = document.createElement("a");
      a.href = currentAudioUrl;
      a.download = "voiso-audio.mp3";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const userVoices = allVoices?.filter((v) => v.user_id === user?.id) || [];
  const defaultVoices = allVoices?.filter((v) => v.user_id === null) || [];

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main generation area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Text input */}
        <div className="space-y-2">
          <Label htmlFor="text" className="text-base font-medium">
            Text to convert to speech
          </Label>
          <Textarea
            id="text"
            placeholder="Enter the text you want to convert to speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] resize-none bg-muted/50"
          />
          <p className="text-sm text-muted-foreground">
            {text.length} characters
          </p>
        </div>

        {/* Voice and language selectors */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {userVoices.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      My Voices
                    </div>
                    {userVoices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} ({voice.type})
                      </SelectItem>
                    ))}
                  </>
                )}
                {defaultVoices.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Default Voices
                    </div>
                    {defaultVoices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate button */}
        <Button
          variant="glow"
          size="lg"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || !voiceId || !text.trim()}
          className="w-full sm:w-auto"
        >
          {generateMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Wand2 className="h-5 w-5" />
          )}
          Generate audio
        </Button>

        {/* Audio player */}
        {currentAudioUrl && (
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="glow"
                size="icon"
                onClick={handlePlayPause}
                className="h-14 w-14 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  {[...Array(30)].map((_, i) => (
                    <div
                      key={i}
                      className="waveform-bar w-1 bg-primary/60"
                      style={{
                        height: `${Math.random() * 30 + 10}px`,
                        animationDelay: `${i * 0.05}s`,
                        animationPlayState: isPlaying ? "running" : "paused",
                      }}
                    />
                  ))}
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <audio
              ref={audioRef}
              src={currentAudioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Recent generations sidebar */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-primary" />
          Recent Generations
        </h3>

        {recentGenerations && recentGenerations.length > 0 ? (
          <div className="space-y-3">
            {recentGenerations.map((gen) => (
              <div
                key={gen.id}
                className="glass-card rounded-lg p-4 space-y-2 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (gen.audio_url) {
                    setCurrentAudioUrl(gen.audio_url);
                  }
                }}
              >
                <p className="text-sm line-clamp-2">{gen.text}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{gen.voice?.name || "Unknown voice"}</span>
                  <span>{format(new Date(gen.created_at), "MMM d, HH:mm")}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-lg p-6 text-center text-muted-foreground">
            <p className="text-sm">No generations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
