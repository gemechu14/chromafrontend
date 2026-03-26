import Link from "next/link";
import {
  Bell,
  Building2,
  ChevronRight,
  KeyRound,
  Shield,
  UserRound,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const settingsSections = [
  {
    title: "Profile",
    description: "Your name, email, and how you appear to the team.",
    icon: UserRound,
    href: "#profile",
    accent: "from-primary/15 to-sky-500/10",
    iconClass: "bg-primary/10 text-primary",
  },
  {
    title: "Security",
    description: "Password, sessions, and two-factor authentication.",
    icon: Shield,
    href: "#security",
    accent: "from-emerald-500/10 to-teal-500/5",
    iconClass: "bg-emerald-500/10 text-emerald-700",
  },
  {
    title: "Notifications",
    description: "Low stock alerts, team activity, and email digests.",
    icon: Bell,
    href: "#notifications",
    accent: "from-amber-500/10 to-orange-500/5",
    iconClass: "bg-amber-500/10 text-amber-800",
  },
  {
    title: "Salon & locations",
    description: "Business details, hours, and per-location defaults.",
    icon: Building2,
    href: "#locations",
    accent: "from-violet-500/10 to-indigo-500/5",
    iconClass: "bg-violet-500/10 text-violet-800",
  },
  {
    title: "API & integrations",
    description: "Connect external tools and manage access keys.",
    icon: KeyRound,
    href: "#integrations",
    accent: "from-slate-500/10 to-slate-400/5",
    iconClass: "bg-slate-500/10 text-slate-700",
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="relative -mx-4 -mt-4 mb-7 w-[calc(100%+2rem)] overflow-hidden border-b border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-primary/[0.07] sm:-mx-6 sm:-mt-6 sm:mb-8 sm:w-[calc(100%+3rem)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,rgba(37,99,235,0.12),transparent)]" />
        <div className="relative max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pb-9 sm:pt-8 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/90">Workspace</p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Manage your account, salon preferences, and how Chroma works for your team — all in one
            place.
          </p>
        </div>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
        {settingsSections.map((section) => (
          <Link key={section.title} href={section.href} className="group block min-w-0">
            <Card
              className={`h-full overflow-hidden border border-slate-200/90 bg-white shadow-card transition-all duration-200 hover:border-primary/25 hover:shadow-primary/10`}
            >
              <CardHeader className="space-y-0 pb-3">
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${section.accent} ${section.iconClass}`}
                >
                  <section.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <CardTitle className="font-display text-base leading-snug group-hover:text-primary">
                  {section.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-90 transition-opacity group-hover:opacity-100">
                  Configure
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Separator className="my-10 bg-slate-200/80" />

      <Card className="border border-slate-200/90 bg-slate-50/50 shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Quick overview</CardTitle>
          <CardDescription>
            Detailed forms for each area will ship in a future release. Use the cards above to
            preview how settings will be organized.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Inventory rules, formula defaults, and role permissions will appear here as your salon
            scales on Chroma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
