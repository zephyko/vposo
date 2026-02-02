import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Generation } from "@/types/voice";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, Download, Volume2, Clock } from "lucide-react";
import { format } from "date-fns";

interface ResultsSectionProps {
  currentAudioUrl: string | null;
  recentGenerations: Generation[];
  onSelectGeneration: (audioUrl: string) => void;
}

export interface ResultsSectionRef {
  scrollIntoView: () => void;
}

export const ResultsSection = forwardRef<ResultsSectionRef, ResultsSectionProps>(
  ({ currentAudioUrl, recentGenerations, onSelectGeneration }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useImperativeHandle(ref, () => ({
      scrollIntoView: () => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    }));

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
        a.download = `voiso-audio-${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };

    const limitedGenerations = recentGenerations.slice(0, 5);

    return (
      <div ref={containerRef} className="space-y-5">
        <h3 className="font-semibold flex items-center gap-2 text-lg">
          <Volume2 className="h-5 w-5 text-primary" />
          Result
        </h3>

        {/* Audio player */}
        {currentAudioUrl ? (
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="glow"
                size="icon"
                onClick={handlePlayPause}
                className="h-14 w-14 rounded-full shrink-0"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 overflow-hidden">
                  {[...Array(24)].map((_, i) => (
                    <div
                      key={i}
                      className="waveform-bar w-1.5 bg-primary/60 rounded-full"
                      style={{
                        height: `${Math.random() * 28 + 8}px`,
                        animationDelay: `${i * 0.05}s`,
                        animationPlayState: isPlaying ? "running" : "paused",
                      }}
                    />
                  ))}
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={handleDownload} className="shrink-0">
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
        ) : (
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
            <Volume2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Generate audio to see results here</p>
          </div>
        )}

        {/* Recent generations */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            Recent Generations
          </h4>

          {limitedGenerations.length > 0 ? (
            <ScrollArea className="h-[180px]">
              <div className="space-y-2 pr-3">
                {limitedGenerations.map((gen) => (
                  <button
                    key={gen.id}
                    className="w-full text-left glass-card rounded-lg p-3 space-y-1.5 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (gen.audio_url) {
                        onSelectGeneration(gen.audio_url);
                      }
                    }}
                  >
                    <p className="text-sm line-clamp-1 font-medium">{gen.text}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate max-w-[120px]">{gen.voice?.name || "Unknown"}</span>
                      <span className="shrink-0">{format(new Date(gen.created_at), "MMM d, HH:mm")}</span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No generations yet
            </div>
          )}
        </div>
      </div>
    );
  }
);

ResultsSection.displayName = "ResultsSection";
