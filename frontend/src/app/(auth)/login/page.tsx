'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';
  const { signIn } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email) e.email = 'Email is required.';
    if (!form.password) e.password = 'Password is required.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await signIn(form.email, form.password);
      router.push(redirectTo);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your Nutrigen account
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="jane@example.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            autoComplete="email"
            autoFocus
          />
          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              autoComplete="current-password"
              rightAddon={
                <button type="button" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <div className="mt-1.5 text-right">
              <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-brand-600 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
