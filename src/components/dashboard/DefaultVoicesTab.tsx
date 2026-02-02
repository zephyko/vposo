import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Voice, VoiceType, parseQwenParams } from "@/types/voice";
import { VoiceCard } from "@/components/voice/VoiceCard";
import { Loader2 } from "lucide-react";

interface DefaultVoicesTabProps {
  onUseTTS: (voice: Voice) => void;
}

export function DefaultVoicesTab({ onUseTTS }: DefaultVoicesTabProps) {
  // Fetch default voices (user_id is null)
  const { data: voices, isLoading } = useQuery({
    queryKey: ["default-voices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voices")
        .select("*")
        .is("user_id", null)
        .eq("type", "default")
        .order("name", { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our Voice type
      return (data || []).map(voice => ({
        ...voice,
        type: voice.type as VoiceType,
        qwen_params: parseQwenParams(voice.qwen_params),
      })) as Voice[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Professional Voices</h2>
        <p className="text-muted-foreground">
          Ready-to-use voices for immediate text-to-speech generation.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {voices?.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            onUseTTS={() => onUseTTS(voice)}
            showPreview
          />
        ))}
      </div>
    </div>
  );
}
