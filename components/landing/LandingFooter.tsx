import Link from "next/link";
import { FlaskConical } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#" },
  ],
  Resources: [
    { label: "System Design", href: "/docs" },
    { label: "Formula Guide", href: "#" },
    { label: "Inventory Setup", href: "#" },
    { label: "Help Center", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

export function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight">
                chroma<span className="text-primary">pro</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Professional hair salon color mixing and inventory management SaaS.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{group}</p>
              <ul className="space-y-2.5">
                {links.map(l => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Chroma Inventory Pro. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs">
            Helping salons track color, reduce waste, and grow profit.
          </p>
        </div>
      </div>
    </footer>
  );
}
