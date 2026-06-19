import Link from 'next/link';
import { FlaskConical, ShieldCheck, BarChart3, Zap, Globe, Lock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <FlaskConical className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-foreground">Nutrigen</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link href="/signup" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 mb-6">
          Powered by GenLayer Consensus
        </span>
        <h1 className="text-5xl font-bold text-foreground leading-tight">
          AI-Powered Livestock<br />Feed Optimization
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Nutrigen uses decentralized AI consensus to generate, validate, and approve livestock feed formulas — ensuring policy compliance, nutritional standards, and cost efficiency on every decision.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/signup" className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
            Start optimizing free
          </Link>
          <Link href="/login" className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold text-foreground mb-12">Everything you need for compliant feed management</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: FlaskConical, title: 'AI Feed Optimizer', desc: 'Generate species-specific feed formulas optimized for growth, cost, and welfare using real-time commodity prices.' },
              { icon: ShieldCheck, title: 'Consensus Validation', desc: 'Every formula is evaluated by multiple GenLayer validators before approval. No single point of failure.' },
              { icon: BarChart3, title: 'Risk Analytics', desc: 'Real-time compliance scoring, risk breakdowns, and trend analytics across your entire herd portfolio.' },
              { icon: Zap, title: 'Instant Results', desc: 'Get full nutritional profiles, growth projections, FCR estimates, and cost analysis in seconds.' },
              { icon: Globe, title: 'Multi-livestock', desc: 'Supports cattle, poultry, swine, sheep, goats, fish — with species-appropriate NRC/FAO standards.' },
              { icon: Lock, title: 'Blockchain Audit Trail', desc: 'Every decision is recorded immutably on-chain. Full transparency, full accountability.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl bg-white border border-border p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <Icon className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground">Ready to optimize your feed strategy?</h2>
        <p className="mt-3 text-muted-foreground">Join organizations using Nutrigen to reduce costs and improve livestock performance.</p>
        <Link href="/signup" className="mt-6 inline-block rounded-lg bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700">
          Create free account
        </Link>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Nutrigen. All rights reserved.
      </footer>
    </div>
  );
}
