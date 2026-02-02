import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Check, Mic2 } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out Voiso",
    features: [
      "5 voice generations per month",
      "Access to default voices",
      "Clone 1 voice",
      "Standard quality audio",
      "Community support",
    ],
    cta: "Get Started",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Creator",
    price: "$19",
    period: "per month",
    description: "For content creators and podcasters",
    features: [
      "100 voice generations per month",
      "All default voices",
      "Clone up to 10 voices",
      "Design unlimited custom voices",
      "HD quality audio",
      "Priority support",
      "Commercial license",
    ],
    cta: "Start Creator Plan",
    variant: "glow" as const,
    popular: true,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For agencies and power users",
    features: [
      "Unlimited voice generations",
      "All default voices",
      "Unlimited voice clones",
      "Unlimited custom voices",
      "Ultra HD quality audio",
      "API access",
      "Dedicated support",
      "Custom voice training",
      "Team collaboration",
    ],
    cta: "Start Pro Plan",
    variant: "secondary" as const,
    popular: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your needs. All plans include access to our
            state-of-the-art Qwen3-TTS technology.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative glass-card rounded-2xl p-8 ${
                plan.popular ? "border-primary" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant={plan.variant} size="lg" className="w-full" asChild>
                <Link to="/auth?mode=signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ or extra info */}
        <div className="mt-24 text-center">
          <p className="text-muted-foreground">
            Need more? Contact us for{" "}
            <span className="text-primary font-medium">enterprise pricing</span>.
          </p>
        </div>
      </div>

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
