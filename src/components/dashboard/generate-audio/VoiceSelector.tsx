import { Voice, LANGUAGES } from "@/types/voice";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mic2, Globe, Info } from "lucide-react";

interface VoiceSelectorProps {
  voiceId: string;
  language: string;
  onVoiceChange: (voiceId: string) => void;
  onLanguageChange: (language: string) => void;
  userVoices: Voice[];
  defaultVoices: Voice[];
  selectedVoice: Voice | undefined;
}

const TYPE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  cloned: { label: "Cloned", variant: "default" },
  designed: { label: "Designed", variant: "secondary" },
  default: { label: "Default", variant: "outline" },
};

export function VoiceSelector({
  voiceId,
  language,
  onVoiceChange,
  onLanguageChange,
  userVoices,
  defaultVoices,
  selectedVoice,
}: VoiceSelectorProps) {
  const typeInfo = selectedVoice ? TYPE_LABELS[selectedVoice.type] : null;

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Voice selector */}
        <div className="space-y-2">
          <Label htmlFor="voice" className="flex items-center gap-2 font-medium">
            <Mic2 className="h-4 w-4 text-primary" />
            Voice
          </Label>
          <Select value={voiceId} onValueChange={onVoiceChange}>
            <SelectTrigger className="bg-muted/30 border-border/50 h-12 text-base">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {userVoices.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    My Voices
                  </div>
                  {userVoices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id} className="py-2">
                      <span className="flex items-center gap-2">
                        {voice.name}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {voice.type}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
              {defaultVoices.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">
                    Default Voices
                  </div>
                  {defaultVoices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id} className="py-2">
                      {voice.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Language selector */}
        <div className="space-y-2">
          <Label htmlFor="language" className="flex items-center gap-2 font-medium">
            <Globe className="h-4 w-4 text-primary" />
            Language
          </Label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="bg-muted/30 border-border/50 h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value} className="py-2">
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected voice details */}
      {selectedVoice && (
        <div className="glass-card rounded-lg p-4 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="font-medium">{selectedVoice.name}</span>
            {typeInfo && (
              <Badge variant={typeInfo.variant} className="ml-auto">
                {typeInfo.label}
              </Badge>
            )}
          </div>
          {selectedVoice.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedVoice.description}
            </p>
          )}
          {selectedVoice.language && selectedVoice.language !== "auto" && (
            <p className="text-xs text-muted-foreground">
              Language: {LANGUAGES.find(l => l.value === selectedVoice.language)?.label || selectedVoice.language}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
