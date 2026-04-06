import { PublicLayout } from "@/components/PublicLayout";
import { BrandLogo } from "@/components/BrandLogo";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight } from "lucide-react";

const Reveal = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const About = () => {
  return (
    <PublicLayout>
      <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 gradient-cream-warm" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 flex justify-center"
          >
            <BrandLogo variant="inline" className="justify-center" />
          </motion.div>
          <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-5">
            Who we are
          </p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-bold text-foreground leading-[1.12] mb-6">
            A steady light for survivors on the path to{" "}
            <span className="italic text-terracotta">safety and healing</span>
          </h1>
          <p className="font-body text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            North Star Sanctuary was founded on a simple belief: everyone deserves a safe place to begin again.
            We are a nonprofit dedicated to supporting survivors of abuse and trafficking with shelter,
            counseling, legal advocacy, and long-term programs that restore dignity and hope.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-background">
        <div className="max-w-3xl mx-auto px-6 space-y-12">
          <Reveal>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4">Our mission</h2>
            <p className="font-body text-muted-foreground leading-relaxed">
              We walk alongside survivors at every stage — from crisis response to independent living — with
              trauma-informed care, respect for autonomy, and measurable outcomes. Our team partners with local
              agencies, volunteers, and donors to expand access to services without compromising quality.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4">What guides us</h2>
            <ul className="space-y-4 font-body text-muted-foreground leading-relaxed">
              <li>
                <span className="text-terracotta font-medium">Safety first — </span>
                Confidential, secure housing and protocols designed around survivor needs.
              </li>
              <li>
                <span className="text-terracotta font-medium">Dignity in every interaction — </span>
                Services are voluntary, survivor-led, and free from judgment.
              </li>
              <li>
                <span className="text-terracotta font-medium">Transparency — </span>
                We publish impact data and allocation of funds so supporters can trust where resources go.
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="py-20 lg:py-28 gradient-section-blush">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Join us in this work
            </h2>
            <p className="font-body text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
              Explore how your contribution fuels programs on the ground, or read our latest transparency report.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-full bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 gap-2">
                <Link to="/#donate">
                  <Heart className="w-4 h-4" /> Donate
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full font-body gap-2 border-border/80 bg-background/50">
                <Link to="/impact">
                  View impact <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
};

export default About;
