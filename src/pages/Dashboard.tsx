import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyVoicesTab } from "@/components/dashboard/MyVoicesTab";
import { DefaultVoicesTab } from "@/components/dashboard/DefaultVoicesTab";
import { GenerateAudioTab } from "@/components/dashboard/GenerateAudioTab";
import { PlanBadge } from "@/components/dashboard/PlanBadge";
import { Mic2, Users, Wand2 } from "lucide-react";
import { Voice } from "@/types/voice";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "my-voices");
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // Handle "Use for TTS" action
  const handleUseTTS = (voice: Voice) => {
    setSelectedVoice(voice);
    handleTabChange("generate");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2">
          <Mic2 className="h-6 w-6 text-primary" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Voice Studio</h1>
            <p className="text-muted-foreground">
              Create, manage, and generate audio with your AI voices.
            </p>
          </div>
          <PlanBadge />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
            <TabsTrigger value="my-voices" className="gap-2 data-[state=active]:bg-background">
              <Mic2 className="h-4 w-4" />
              My Voices
            </TabsTrigger>
            <TabsTrigger value="default-voices" className="gap-2 data-[state=active]:bg-background">
              <Users className="h-4 w-4" />
              Default Voices
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-2 data-[state=active]:bg-background">
              <Wand2 className="h-4 w-4" />
              Generate Audio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-voices" className="animate-fade-in">
            <MyVoicesTab onUseTTS={handleUseTTS} />
          </TabsContent>

          <TabsContent value="default-voices" className="animate-fade-in">
            <DefaultVoicesTab onUseTTS={handleUseTTS} />
          </TabsContent>

          <TabsContent value="generate" className="animate-fade-in">
            <GenerateAudioTab selectedVoice={selectedVoice} onVoiceChange={setSelectedVoice} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
