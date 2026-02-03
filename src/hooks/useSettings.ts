import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface UserSettings {
  id: string;
  user_id: string;
  qwen_api_base_url: string | null;
  qwen_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsInput {
  qwen_api_base_url: string | null;
  qwen_api_key: string | null;
}

export function useSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserSettings | null;
    },
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      if (!user) throw new Error("Not authenticated");

      // Check if settings exist
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update existing settings
        const { error } = await supabase
          .from("user_settings")
          .update({
            qwen_api_base_url: input.qwen_api_base_url,
            qwen_api_key: input.qwen_api_key,
          })
          .eq("user_id", user.id);
        
        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            qwen_api_base_url: input.qwen_api_base_url,
            qwen_api_key: input.qwen_api_key,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      toast({
        title: "Settings saved",
        description: "Your Qwen API settings have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isConfigured = !!(settings?.qwen_api_base_url && settings?.qwen_api_key);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    isConfigured,
  };
}
