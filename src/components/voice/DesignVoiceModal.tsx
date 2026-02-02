import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LANGUAGES } from "@/types/voice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2 } from "lucide-react";

interface DesignVoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "neutral", label: "Neutral" },
] as const;

const AGE_RANGES = [
  { value: "young", label: "Young (18-30)" },
  { value: "middle", label: "Middle-aged (30-50)" },
  { value: "mature", label: "Mature (50+)" },
] as const;

const SPEAKING_STYLES = [
  { value: "conversational", label: "Conversational" },
  { value: "professional", label: "Professional" },
  { value: "narrative", label: "Narrative/Storytelling" },
  { value: "dramatic", label: "Dramatic" },
  { value: "news", label: "News Anchor" },
] as const;

const EMOTIONS = [
  { value: "neutral", label: "Neutral" },
  { value: "happy", label: "Happy/Cheerful" },
  { value: "calm", label: "Calm/Soothing" },
  { value: "energetic", label: "Energetic/Excited" },
  { value: "serious", label: "Serious/Authoritative" },
] as const;

const SPEEDS = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
] as const;

export function DesignVoiceModal({ open, onOpenChange, onSuccess }: DesignVoiceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("auto");
  const [gender, setGender] = useState("female");
  const [ageRange, setAgeRange] = useState("middle");
  const [speakingStyle, setSpeakingStyle] = useState("conversational");
  const [emotion, setEmotion] = useState("neutral");
  const [speed, setSpeed] = useState("normal");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Build voice description from selected parameters
  const buildVoiceDescription = () => {
    const genderLabel = GENDERS.find(g => g.value === gender)?.label || gender;
    const ageLabel = AGE_RANGES.find(a => a.value === ageRange)?.label || ageRange;
    const styleLabel = SPEAKING_STYLES.find(s => s.value === speakingStyle)?.label || speakingStyle;
    const emotionLabel = EMOTIONS.find(e => e.value === emotion)?.label || emotion;
    const speedLabel = SPEEDS.find(s => s.value === speed)?.label || speed;

    let description = `A ${ageLabel.toLowerCase()} ${genderLabel.toLowerCase()} voice with a ${styleLabel.toLowerCase()} speaking style. `;
    description += `The tone is ${emotionLabel.toLowerCase()} and the speaking pace is ${speedLabel.toLowerCase()}. `;
    
    if (additionalNotes.trim()) {
      description += additionalNotes.trim();
    }

    return description;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);

    try {
      const voiceDescription = buildVoiceDescription();

      // Create voice record with voice design parameters
      const { error: voiceError } = await supabase.from("voices").insert({
        user_id: user.id,
        name: name.trim(),
        type: "designed",
        source_model: "Qwen3-TTS-VoiceDesign",
        description: voiceDescription,
        language,
        qwen_params: {
          task_type: "VoiceDesign",
          voice_description: voiceDescription,
        },
      });

      if (voiceError) throw voiceError;

      toast({ title: "Voice designed!", description: "Your custom voice has been created." });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Design error:", error);
      toast({
        title: "Failed to design voice",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setLanguage("auto");
    setGender("female");
    setAgeRange("middle");
    setSpeakingStyle("conversational");
    setEmotion("neutral");
    setSpeed("normal");
    setAdditionalNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-accent" />
            Design a new voice
          </DialogTitle>
          <DialogDescription>
            Configure voice characteristics to create your custom voice.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Voice name *</Label>
            <Input
              id="name"
              placeholder="e.g., Professional Narrator"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Voice characteristics grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageRange">Age Range</Label>
              <Select value={ageRange} onValueChange={setAgeRange} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGE_RANGES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speakingStyle">Speaking Style</Label>
              <Select value={speakingStyle} onValueChange={setSpeakingStyle} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEAKING_STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emotion">Emotion/Tone</Label>
              <Select value={emotion} onValueChange={setEmotion} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMOTIONS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="speed">Speaking Pace</Label>
              <Select value={speed} onValueChange={setSpeed} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEEDS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Primary Language</Label>
              <Select value={language} onValueChange={setLanguage} disabled={loading}>
                <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes (optional)</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Add specific details like accent, unique characteristics, or any special requirements..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              disabled={loading}
              className="min-h-[80px]"
            />
          </div>

          {/* Preview of generated description */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Generated Description Preview:</p>
            <p className="text-sm">{buildVoiceDescription()}</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Create voice
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
