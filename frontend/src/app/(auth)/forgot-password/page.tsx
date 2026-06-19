'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MailCheck } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-sm text-center" padding="lg">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <MailCheck className="h-6 w-6 text-brand-600" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Check your email</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ve sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
        </p>
        <Link href="/login">
          <Button variant="outline" className="mt-6 w-full">Back to Sign In</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="jane@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
          <Button type="submit" className="w-full" loading={loading} disabled={!email}>
            Send Reset Link
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
