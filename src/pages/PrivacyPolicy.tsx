import { PublicLayout } from "@/components/PublicLayout";
import { motion } from "framer-motion";

const sections = [
  { id: "collection", title: "Information We Collect", content: `We collect information you provide directly, such as when you make a donation, volunteer, or contact us. This may include your name, email address, phone number, and payment information. We also automatically collect certain technical information when you visit our website, including IP address, browser type, and pages visited. We never collect personal information about the survivors we serve without explicit, informed consent.` },
  { id: "use", title: "How We Use Your Information", content: `We use your information to process donations, communicate with supporters, improve our services, and comply with legal obligations. Donor information is used to send receipts, acknowledgments, and updates about our programs. We do not sell, rent, or trade your personal information to third parties. Analytics data helps us improve the website experience.` },
  { id: "protection", title: "Data Protection & Security", content: `We implement industry-standard security measures to protect your data, including 256-bit SSL encryption, secure payment processing through PCI-compliant providers, and regular security audits. Access to personal data is restricted to authorized personnel only. All staff undergo privacy training and are bound by confidentiality agreements.` },
  { id: "cookies", title: "Cookies & Tracking", content: `Our website uses essential cookies to ensure basic functionality. With your consent, we may use analytics cookies to understand how visitors interact with our site. You can manage cookie preferences at any time through your browser settings or our cookie consent manager. We do not use cookies for advertising purposes.` },
  { id: "rights", title: "Your Rights", content: `You have the right to access, correct, or delete your personal information. You may opt out of marketing communications at any time. To exercise these rights, contact our Privacy Officer at privacy@northstarsanctuary.org. We will respond to all requests within 30 days.` },
  { id: "children", title: "Children's Privacy", content: `We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete it promptly. For children in our care programs, all data handling follows strict HIPAA and child protection regulations.` },
  { id: "changes", title: "Changes to This Policy", content: `We may update this Privacy Policy periodically. Material changes will be communicated through our website and, where possible, via email. The date of the most recent revision is always noted at the top of this page.` },
];

const PrivacyPolicy = () => {
  return (
    <PublicLayout>
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-body font-semibold uppercase tracking-widest text-gold mb-3">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground font-body mb-2">Last updated: March 15, 2024</p>
            <p className="text-muted-foreground font-body text-sm leading-relaxed mb-12 max-w-2xl">
              North Star Sanctuary is committed to protecting the privacy and security of all individuals
              who interact with our organization — especially the survivors we serve.
            </p>
          </motion.div>

          {/* Table of Contents */}
          <div className="rounded-xl border border-border bg-card p-6 mb-12">
            <h3 className="font-body font-semibold text-sm text-card-foreground mb-3">Contents</h3>
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {sections.map((s, i) => (
                <a key={s.id} href={`#${s.id}`} className="text-sm font-body text-muted-foreground hover:text-gold transition-colors py-1">
                  {i + 1}. {s.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="space-y-12">
            {sections.map((s, i) => (
              <motion.div
                key={s.id}
                id={s.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl font-display font-semibold text-foreground mb-3">
                  {i + 1}. {s.title}
                </h2>
                <p className="text-sm font-body text-muted-foreground leading-relaxed">{s.content}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 rounded-xl bg-secondary/50 p-6">
            <h3 className="font-display font-semibold text-foreground mb-2">Questions?</h3>
            <p className="text-sm text-muted-foreground font-body">
              Contact our Privacy Officer at{" "}
              <a href="mailto:privacy@northstarsanctuary.org" className="text-gold hover:underline">
                privacy@northstarsanctuary.org
              </a>
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default PrivacyPolicy;
