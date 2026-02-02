import { useState, useRef } from "react";
import { Voice } from "@/types/voice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Wand2, Trash2, Mic2, Palette, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceCardProps {
  voice: Voice;
  onUseTTS: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
  showPreview?: boolean;
}

export function VoiceCard({
  voice,
  onUseTTS,
  onDelete,
  showDelete,
  showPreview,
}: VoiceCardProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePreview = async () => {
    // If we already have audio loaded, just play/pause
    if (previewUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Generate a preview sample
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-audio", {
        body: {
          voice_id: voice.id,
          text: "Hello, this is a preview of my voice. I hope you like how I sound!",
          language: voice.language || "auto",
        },
      });

      if (error) throw error;

      setPreviewUrl(data.audio_url);
      // Play the audio after a short delay for the element to update
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
    } catch (error: any) {
      toast({
        title: "Preview failed",
        description: error.message || "Could not generate preview",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const getTypeIcon = () => {
    switch (voice.type) {
      case "cloned":
        return <Mic2 className="h-4 w-4" />;
      case "designed":
        return <Palette className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (voice.type) {
      case "cloned":
        return "bg-primary/10 text-primary";
      case "designed":
        return "bg-accent/10 text-accent";
      default:
        return "bg-success/10 text-success";
    }
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      auto: "Auto",
      en: "English",
      zh: "Chinese",
      es: "Spanish",
      fr: "French",
      de: "German",
      ja: "Japanese",
      ko: "Korean",
      pt: "Portuguese",
      ru: "Russian",
      ar: "Arabic",
    };
    return labels[lang] || lang;
  };

  return (
    <div className="glass-card rounded-xl p-5 group hover:border-primary/50 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor()}`}
          >
            {getTypeIcon()}
          </div>
          <div>
            <h4 className="font-semibold">{voice.name}</h4>
            <Badge variant="outline" className="text-xs capitalize">
              {voice.type}
            </Badge>
          </div>
        </div>
        {showDelete && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {voice.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {voice.description}
        </p>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary" className="text-xs">
          {getLanguageLabel(voice.language)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {voice.source_model}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {showPreview && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handlePreview}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {isLoading ? "Loading..." : isPlaying ? "Pause" : "Preview"}
          </Button>
        )}
        <Button variant="glow" size="sm" className="flex-1" onClick={onUseTTS}>
          <Wand2 className="h-3 w-3" />
          Use for TTS
        </Button>
      </div>

      {/* Hidden audio element for preview playback */}
      {previewUrl && (
        <audio
          ref={audioRef}
          src={previewUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
