'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, Leaf, ShieldCheck, Wallet } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import type { Metadata } from 'next';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'generating' | 'done'>('form');

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    if (!form.email) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setStep('generating');

    try {
      await signUp(form.email, form.password, form.fullName);
      setStep('done');
      toast.success('Account created! Welcome to Nutrigen.');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setStep('form');
      toast.error(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'generating') {
    return (
      <Card className="w-full max-w-md text-center" padding="lg">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-brand-100">
            <Wallet className="h-7 w-7 text-brand-600" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Creating your account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Generating your blockchain wallet and encrypting it with your password. This takes just a moment.
        </p>
        <div className="mt-6 space-y-2">
          {['Creating account', 'Generating wallet', 'Encrypting with your password', 'Saving securely'].map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
              {s}…
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          A blockchain wallet will be auto-generated and linked to your account.
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Full Name"
            type="text"
            placeholder="Jane Doe"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            error={errors.fullName}
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            placeholder="jane@example.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            autoComplete="new-password"
            hint="This password also encrypts your blockchain wallet — save it somewhere safe."
            rightAddon={
              <button type="button" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            required
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            error={errors.confirm}
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full" loading={loading}>
            Create Account
          </Button>
        </form>
      </Card>

      {/* Trust signals */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Wallet, label: 'Auto wallet', sub: 'Generated instantly' },
          { icon: ShieldCheck, label: 'Encrypted', sub: 'Your key, your control' },
          { icon: Leaf, label: 'On-chain', sub: 'Immutable records' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 text-center">
            <Icon className="h-5 w-5 text-brand-600" />
            <span className="text-xs font-medium text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">{sub}</span>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
