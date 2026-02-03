import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Settings as SettingsIcon, Eye, EyeOff, ArrowLeft, Info } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { settings, isLoading, updateSettings, isConfigured } = useSettings();

  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Populate form with existing settings
  useEffect(() => {
    if (settings) {
      setApiBaseUrl(settings.qwen_api_base_url || "");
      setApiKey(settings.qwen_api_key || "");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      qwen_api_base_url: apiBaseUrl.trim() || null,
      qwen_api_key: apiKey.trim() || null,
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure your Qwen3-TTS backend connection.
            </p>
          </div>

          {/* Qwen API Configuration Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Qwen API Configuration
              </CardTitle>
              <CardDescription>
                Enter your Qwen3-TTS API credentials to enable audio generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Alert */}
              {isConfigured ? (
                <Alert className="border-success/50 bg-success/10">
                  <Info className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">
                    Qwen API is configured and ready to use.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-warning/50 bg-warning/10">
                  <Info className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-warning">
                    Qwen API is not configured. Audio generation will not work until you add your credentials.
                  </AlertDescription>
                </Alert>
              )}

              {/* API Base URL */}
              <div className="space-y-2">
                <Label htmlFor="api-base-url">API Base URL</Label>
                <Input
                  id="api-base-url"
                  type="url"
                  placeholder="https://api.example.com/v1"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The base URL for your Qwen3-TTS API endpoint. Example: <code>https://dashscope.aliyuncs.com/compatible-mode/v1</code>
                </p>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your API key for authentication. Keep this secret!
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="glow"
                onClick={handleSave}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Help Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                To use Qwen3-TTS for audio generation, you'll need:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <strong>Alibaba Cloud Account:</strong> Sign up at{" "}
                  <a
                    href="https://www.alibabacloud.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    alibabacloud.com
                  </a>
                </li>
                <li>
                  <strong>Enable DashScope:</strong> Access the AI model service in your console
                </li>
                <li>
                  <strong>Generate API Key:</strong> Create an API key in the DashScope console
                </li>
                <li>
                  <strong>Copy URL & Key:</strong> Paste them in the fields above
                </li>
              </ol>
              <p className="pt-2">
                Alternatively, you can use any OpenAI-compatible TTS endpoint like a self-hosted vLLM instance.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
