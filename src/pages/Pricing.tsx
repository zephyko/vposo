import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Check, Mic2, Loader2, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlan, UserPlan, PLAN_LABELS } from "@/hooks/usePlan";
import { useToast } from "@/hooks/use-toast";

const plans: Array<{
  id: UserPlan;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  variant: "outline" | "glow" | "secondary";
  popular: boolean;
}> = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out Voiso",
    features: [
      "20 voice generations per day",
      "Access to default voices",
      "Clone 1 voice",
      "Standard quality audio",
      "Community support",
    ],
    variant: "outline",
    popular: false,
  },
  {
    id: "creator",
    name: "Creator",
    price: "$19",
    period: "per month",
    description: "For content creators and podcasters",
    features: [
      "200 voice generations per day",
      "All default voices",
      "Clone up to 10 voices",
      "Design unlimited custom voices",
      "HD quality audio",
      "Priority support",
      "Commercial license",
    ],
    variant: "glow",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For agencies and power users",
    features: [
      "1000 voice generations per day",
      "All default voices",
      "Unlimited voice clones",
      "Unlimited custom voices",
      "Ultra HD quality audio",
      "API access",
      "Dedicated support",
      "Custom voice training",
      "Team collaboration",
    ],
    variant: "secondary",
    popular: false,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const { plan: currentPlan, switchPlan, isSwitching } = usePlan();
  const { toast } = useToast();

  const handleSwitchPlan = async (newPlan: UserPlan) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to change your plan.",
        variant: "destructive",
      });
      return;
    }

    if (newPlan === currentPlan) {
      toast({
        title: "Already on this plan",
        description: `You're already on the ${PLAN_LABELS[newPlan]} plan.`,
      });
      return;
    }

    try {
      await switchPlan(newPlan);
      toast({
        title: "Plan updated!",
        description: `You're now on the ${PLAN_LABELS[newPlan]} plan.`,
      });
    } catch (error) {
      toast({
        title: "Failed to switch plan",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getButtonContent = (planId: UserPlan) => {
    if (!user) {
      return planId === "free" ? "Get Started" : `Start ${PLAN_LABELS[planId]} Plan`;
    }

    if (planId === currentPlan) {
      return "Current Plan";
    }

    if (isSwitching) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    return `Switch to ${PLAN_LABELS[planId]}`;
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your needs. All plans include access to our
            state-of-the-art Qwen3-TTS technology.
          </p>
        </div>

        {/* Current Plan indicator */}
        {user && (
          <div className="flex items-center justify-center gap-2 mb-12">
            <Crown className="h-5 w-5 text-primary" />
            <span className="text-lg">
              Current plan:{" "}
              <Badge variant="secondary" className="text-base px-3 py-1">
                {PLAN_LABELS[currentPlan]}
              </Badge>
            </span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = user && plan.id === currentPlan;
            
            return (
              <div
                key={plan.name}
                className={`relative glass-card rounded-2xl p-8 transition-all ${
                  plan.popular ? "border-primary" : ""
                } ${isCurrentPlan ? "ring-2 ring-primary/50" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Your Plan
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

                {user ? (
                  <Button
                    variant={plan.variant}
                    size="lg"
                    className="w-full"
                    disabled={isCurrentPlan || isSwitching}
                    onClick={() => handleSwitchPlan(plan.id)}
                  >
                    {getButtonContent(plan.id)}
                  </Button>
                ) : (
                  <Button variant={plan.variant} size="lg" className="w-full" asChild>
                    <Link to="/auth?mode=signup">{getButtonContent(plan.id)}</Link>
                  </Button>
                )}
              </div>
            );
          })}
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
