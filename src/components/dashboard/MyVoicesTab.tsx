import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Voice, VoiceType, parseQwenParams } from "@/types/voice";
import { Button } from "@/components/ui/button";
import { VoiceCard } from "@/components/voice/VoiceCard";
import { CloneVoiceModal } from "@/components/voice/CloneVoiceModal";
import { DesignVoiceModal } from "@/components/voice/DesignVoiceModal";
import { Mic2, Wand2, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MyVoicesTabProps {
  onUseTTS: (voice: Voice) => void;
}

export function MyVoicesTab({ onUseTTS }: MyVoicesTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [designModalOpen, setDesignModalOpen] = useState(false);

  // Fetch user's voices
  const { data: voices, isLoading } = useQuery({
    queryKey: ["my-voices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voices")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Voice type
      return (data || []).map(voice => ({
        ...voice,
        type: voice.type as VoiceType,
        qwen_params: parseQwenParams(voice.qwen_params),
      })) as Voice[];
    },
    enabled: !!user,
  });

  // Delete voice mutation
  const deleteMutation = useMutation({
    mutationFn: async (voiceId: string) => {
      const { error } = await supabase.from("voices").delete().eq("id", voiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-voices"] });
      toast({ title: "Voice deleted", description: "Your voice has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete voice.", variant: "destructive" });
    },
  });

  const handleVoiceCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["my-voices"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-4">
        <Button variant="glow" onClick={() => setCloneModalOpen(true)}>
          <Mic2 className="h-4 w-4" />
          Clone a new voice
        </Button>
        <Button variant="accent" onClick={() => setDesignModalOpen(true)}>
          <Wand2 className="h-4 w-4" />
          Design a new voice
        </Button>
      </div>

      {/* Voices list */}
      {voices && voices.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {voices.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              onUseTTS={() => onUseTTS(voice)}
              onDelete={() => deleteMutation.mutate(voice.id)}
              showDelete
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No voices yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first voice by cloning from audio or designing with text.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="glow" onClick={() => setCloneModalOpen(true)}>
              <Mic2 className="h-4 w-4" />
              Clone a voice
            </Button>
            <Button variant="accent" onClick={() => setDesignModalOpen(true)}>
              <Wand2 className="h-4 w-4" />
              Design a voice
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CloneVoiceModal
        open={cloneModalOpen}
        onOpenChange={setCloneModalOpen}
        onSuccess={handleVoiceCreated}
      />
      <DesignVoiceModal
        open={designModalOpen}
        onOpenChange={setDesignModalOpen}
        onSuccess={handleVoiceCreated}
      />
    </div>
  );
}
