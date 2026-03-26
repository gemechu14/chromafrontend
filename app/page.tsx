import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { EmpowerSection } from "@/components/landing/EmpowerSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <HeroSection />
      <StatsSection />
      <EmpowerSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FaqSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
