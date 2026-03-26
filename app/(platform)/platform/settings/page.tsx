import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Database,
  Globe,
  Shield,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const platformSections = [
  {
    title: "Global catalog",
    description: "Brands, lines, and shared product metadata across tenants.",
    icon: Database,
    href: "/platform/catalog",
    accent: "from-amber-500/20 to-amber-600/5",
    iconClass: "bg-amber-500/15 text-amber-800",
  },
  {
    title: "Tenants & billing",
    description: "Plans, trials, and salon account lifecycle.",
    icon: Building2,
    href: "/platform/tenants",
    accent: "from-orange-500/15 to-amber-500/5",
    iconClass: "bg-orange-500/10 text-orange-900",
  },
  {
    title: "Operators & access",
    description: "Who can administer the platform and audit actions.",
    icon: Users,
    href: "#operators",
    accent: "from-amber-400/15 to-yellow-500/5",
    iconClass: "bg-amber-400/15 text-amber-950",
  },
  {
    title: "Security & compliance",
    description: "Policies, SSO hooks, and data retention (coming soon).",
    icon: Shield,
    href: "#security",
    accent: "from-amber-600/15 to-amber-700/5",
    iconClass: "bg-amber-600/12 text-amber-950",
  },
  {
    title: "Domains & email",
    description: "Outbound email, DNS, and branded links.",
    icon: Globe,
    href: "#domains",
    accent: "from-amber-500/12 to-amber-400/5",
    iconClass: "bg-amber-500/12 text-amber-950",
  },
] as const;

export default function PlatformSettingsPage() {
  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="relative -mx-4 -mt-4 mb-7 w-[calc(100%+2rem)] overflow-hidden border-b border-amber-200/60 bg-gradient-to-br from-amber-50/90 via-white to-amber-100/30 sm:-mx-6 sm:-mt-6 sm:mb-8 sm:w-[calc(100%+3rem)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_80%_-15%,rgba(245,158,11,0.18),transparent)]" />
        <div className="relative max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pb-9 sm:pt-8 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-800/90">
            Platform
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform settings
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Configure how Chroma operates across all salons — catalog, tenants, and operator access.
          </p>
        </div>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
        {platformSections.map((section) => (
          <Link key={section.title} href={section.href} className="group block min-w-0">
            <Card className="h-full overflow-hidden border border-amber-200/70 bg-white shadow-card transition-all duration-200 hover:border-amber-400/50 hover:shadow-md">
              <CardHeader className="space-y-0 pb-3">
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${section.accent} ${section.iconClass}`}
                >
                  <section.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <CardTitle className="font-display text-base leading-snug group-hover:text-amber-900">
                  {section.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-800/90 transition-opacity group-hover:opacity-100">
                  Open
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Separator className="my-10 bg-amber-200/60" />

      <Card className="border border-amber-200/80 bg-amber-50/40 shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Roadmap</CardTitle>
          <CardDescription>
            Deep configuration screens for each area will connect here as the platform admin surface
            grows.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Links to catalog and tenants go to live sections; hash links mark placeholders for
            upcoming platform controls.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
