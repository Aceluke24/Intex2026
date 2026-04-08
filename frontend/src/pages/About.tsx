import { PublicLayout } from "@/components/PublicLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";
import { PublicSafetyNote } from "@/components/PublicSafetyNote";

const About = () => {
  return (
    <PublicLayout>
      <section className="pt-28 pb-18 sm:pt-32 lg:pt-36 gradient-cream-warm">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-terracotta mb-4">About North Star Sanctuary</p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-tight text-foreground leading-[1.12] mb-5">
            Restoring safety, dignity, and long-term independence
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            North Star Sanctuary was inspired by organizations like Lighthouse Sanctuary, expanding this life-saving work into underserved regions of India.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-xl bg-muted/40 p-6 lg:p-8">
            <p className="text-xs uppercase tracking-wide text-terracotta mb-3">Mission statement</p>
            <p className="text-foreground leading-relaxed text-base lg:text-lg">
              Our mission is to provide safe housing, holistic rehabilitation, and a path to independence for girls rescued from trafficking and abuse - while building sustainable systems that prevent exploitation in the future.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-4">How Girls Are Found</h2>
          <p className="text-muted-foreground leading-relaxed">
            We work with local partners, outreach teams, and rescue organizations to identify and support girls in need. Each case is carefully assessed before placement.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-6">Today vs Future</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl bg-muted/40 p-6">
              <h3 className="font-semibold text-foreground mb-3">Today</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Operating safehouses</li>
                <li>Providing direct care</li>
              </ul>
            </div>
            <div className="rounded-xl bg-muted/40 p-6">
              <h3 className="font-semibold text-foreground mb-3">Future</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Expand to new regions</li>
                <li>Increase capacity</li>
                <li>Build prevention programs</li>
                <li>Strengthen reintegration systems</li>
              </ul>
            </div>
          </div>
          <PublicSafetyNote className="mt-5" />
        </div>
      </section>

      <section className="py-16 lg:py-20 gradient-cream-warm">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-4">Learn More About Our Mission</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-7">
            Explore the mission and values that shape every care decision and partnership.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 gap-2 h-12 px-7 transition-all duration-300 ease-out hover:scale-[1.02]">
              <Link to="/donate">
                <Heart className="w-4 h-4" />
                Donate
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full gap-2 h-12 px-7 transition-all duration-300 ease-out hover:scale-[1.02]">
              <Link to="/mission">
                Mission & Values <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default About;
