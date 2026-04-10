import { PublicLayout } from "@/components/PublicLayout";
import { motion } from "framer-motion";

const Reveal = ({ children, className = "", delay: d = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.7, delay: d, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const sections = [
  { id: "collection", title: "Information We Collect", content: `We collect information you provide directly, such as when you make a donation, volunteer, or contact us. This may include your name, email address, phone number, and payment information. We also automatically collect certain technical information when you visit our website, including IP address, browser type, and pages visited. We never collect personal information about the survivors we serve without explicit, informed consent.` },
  { id: "use", title: "How We Use Your Information", content: `We use your information to process donations, communicate with supporters, improve our services, and comply with legal obligations. Donor information is used to send receipts, acknowledgments, and updates about our programs. We do not sell, rent, or trade your personal information to third parties.` },
  { id: "protection", title: "Data Protection & Security", content: `We implement industry-standard security measures including 256-bit SSL encryption, PCI-compliant payment processing, and regular security audits. Access to personal data is restricted to authorized personnel only. All staff undergo privacy training and are bound by confidentiality agreements.` },
  { id: "cookies", title: "Cookies & Tracking", content: `Our website uses essential cookies to ensure basic functionality. With your consent, we may use analytics cookies to understand how visitors interact with our site. You can manage cookie preferences at any time. We do not use cookies for advertising purposes.` },
  { id: "rights", title: "Your Rights", content: `You have the right to access, correct, or delete your personal information. You may opt out of marketing communications at any time. Contact our Privacy Officer at privacy@northstarsanctuary.org. We will respond within 30 days.` },
  { id: "children", title: "Children's Privacy", content: `We do not knowingly collect personal information from children under 13. For children in our care programs, all data handling follows strict HIPAA and child protection regulations.` },
  { id: "changes", title: "Changes to This Policy", content: `We may update this Privacy Policy periodically. Material changes will be communicated through our website. The date of the most recent revision is always noted at the top of this page.` },
];

const PrivacyPolicy = () => (
  <PublicLayout>
    <section className="pt-10 lg:pt-14 pb-28 gradient-cream-warm">
      <div className="max-w-3xl mx-auto px-6">
        <Reveal>
          <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-6">Legal</p>
          <h1 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold text-foreground leading-[1.1] mb-4">Privacy Policy</h1>
          <p className="font-body text-sm text-muted-foreground">Last updated: March 15, 2024</p>
        </Reveal>
      </div>
    </section>

    <section className="pb-28 bg-background">
      <div className="max-w-3xl mx-auto px-6 -mt-8">
        {/* TOC */}
        <Reveal>
          <nav className="bg-card rounded-2xl p-8 mb-16">
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.2em] text-terracotta mb-4">Contents</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {sections.map((s, i) => (
                <a key={s.id} href={`#${s.id}`} className="text-sm font-body text-muted-foreground hover:text-terracotta transition-colors py-1">
                  {i + 1}. {s.title}
                </a>
              ))}
            </div>
          </nav>
        </Reveal>

        <div className="space-y-16">
          {sections.map((s, i) => (
            <Reveal key={s.id}>
              <div id={s.id} className="scroll-mt-[var(--public-header-height)]">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  {i + 1}. {s.title}
                </h2>
                <p className="font-body text-sm text-muted-foreground leading-[1.8]">{s.content}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-20 bg-terracotta/8 rounded-2xl p-8">
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">Questions?</h3>
            <p className="font-body text-sm text-muted-foreground">
              Contact our Privacy Officer at{" "}
              <a href="mailto:privacy@northstarsanctuary.org" className="text-terracotta hover:underline">
                privacy@northstarsanctuary.org
              </a>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  </PublicLayout>
);

export default PrivacyPolicy;
