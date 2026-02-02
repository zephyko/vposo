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

export function DesignVoiceModal({ open, onOpenChange, onSuccess }: DesignVoiceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("auto");
  const [voiceDescription, setVoiceDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !voiceDescription.trim()) return;

    setLoading(true);

    try {
      // Create voice record with voice design parameters
      const { error: voiceError } = await supabase.from("voices").insert({
        user_id: user.id,
        name: name.trim(),
        type: "designed",
        source_model: "Qwen3-TTS-VoiceDesign",
        description: voiceDescription.trim(),
        language,
        qwen_params: {
          task_type: "VoiceDesign",
          voice_description: voiceDescription.trim(),
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
    setVoiceDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-accent" />
            Design a new voice
          </DialogTitle>
          <DialogDescription>
            Describe the voice you want to create using natural language.
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

          <div className="space-y-2">
            <Label htmlFor="voiceDescription">Voice description *</Label>
            <Textarea
              id="voiceDescription"
              placeholder="Describe the voice you want to create. For example: A warm, friendly female voice with a slight British accent, speaking in a calm and professional manner, suitable for corporate presentations..."
              value={voiceDescription}
              onChange={(e) => setVoiceDescription(e.target.value)}
              disabled={loading}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about gender, age, accent, tone, pace, and style.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Primary language</Label>
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
              disabled={loading || !name.trim() || !voiceDescription.trim()}
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
