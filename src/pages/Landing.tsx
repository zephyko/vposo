import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Mic2, Wand2, Zap, Play, ArrowRight, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              Powered by Qwen3-TTS
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
              Create stunning AI voices
              <br />
              <span className="text-gradient">in seconds</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
              Clone any voice or design entirely new ones. Voiso makes professional
              voice synthesis accessible to everyone with state-of-the-art AI.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
              <Button size="xl" variant="glow" asChild>
                <Link to="/auth?mode=signup">
                  Start creating free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/pricing">
                  View pricing
                </Link>
              </Button>
            </div>
          </div>

          {/* Waveform Animation */}
          <div className="mt-20 flex items-center justify-center gap-1">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="waveform-bar w-1.5 bg-primary/60"
                style={{
                  height: `${Math.random() * 40 + 20}px`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need for voice creation
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Professional voice synthesis tools designed for creators, developers, and businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="glass-card rounded-2xl p-8 group hover:border-primary/50 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Mic2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Voice Cloning</h3>
              <p className="text-muted-foreground">
                Clone any voice with just 10-60 seconds of audio. Create perfect replicas
                for consistent content creation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card rounded-2xl p-8 group hover:border-primary/50 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Wand2 className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Voice Design</h3>
              <p className="text-muted-foreground">
                Describe your ideal voice in natural language and let AI generate it.
                No audio samples needed.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card rounded-2xl p-8 group hover:border-primary/50 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center mb-6 group-hover:bg-success/20 transition-colors">
                <Zap className="h-7 w-7 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Generation</h3>
              <p className="text-muted-foreground">
                Generate high-quality speech in seconds. Support for multiple languages
                and natural-sounding output.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Default Voices Preview */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready-to-use voices
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get started instantly with our curated collection of professional voices.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Nova", desc: "Warm female narrator", lang: "English" },
              { name: "Kofi", desc: "Calm male storyteller", lang: "English" },
              { name: "Aya", desc: "Energetic female host", lang: "Multilingual" },
              { name: "Marcus", desc: "Deep authoritative male", lang: "English" },
              { name: "Mei", desc: "Soft-spoken female", lang: "Chinese" },
              { name: "Carlos", desc: "Friendly conversationalist", lang: "Spanish" },
            ].map((voice) => (
              <div
                key={voice.name}
                className="glass-card rounded-xl p-6 flex items-center gap-4 group hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{voice.name}</h4>
                  <p className="text-sm text-muted-foreground">{voice.desc}</p>
                  <span className="text-xs text-primary">{voice.lang}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth?mode=signup">
                Try all voices free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center glass-card rounded-3xl p-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to create your voice?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of creators using Voiso to bring their content to life.
            </p>
            <Button size="xl" variant="glow" asChild>
              <Link to="/auth?mode=signup">
                Get started for free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Mic2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Voiso</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Voiso. Powered by Qwen3-TTS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
