'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
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
    try {
      await resetPassword(form.password);
      setDone(true);
      toast.success('Password updated successfully.');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="w-full max-w-sm text-center" padding="lg">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-brand-600" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Password updated!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Redirecting you to your dashboard…
        </p>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose a strong password for your account.
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            autoComplete="new-password"
            autoFocus
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
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
