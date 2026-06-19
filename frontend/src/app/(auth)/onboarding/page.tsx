'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Building2, CheckCircle2 } from 'lucide-react';
import { Button, Input, Textarea, Card } from '@/components/ui';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useOrgStore } from '@/store/orgStore';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setOrganization } = useOrgStore();

  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'done'>('form');

  function handleNameChange(name: string) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setForm({ ...form, name, slug });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Organization name is required.';
    if (!form.slug.trim()) e.slug = 'Slug is required.';
    else if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Only lowercase letters, numbers, and hyphens.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!user) { toast.error('Not authenticated.'); return; }

    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      // Create organization
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() })
        .select()
        .single();

      if (orgErr) {
        if (orgErr.code === '23505') throw new Error('That organization slug is already taken. Try another.');
        throw new Error(orgErr.message);
      }

      // Link user to org as owner
      const { error: userErr } = await supabase
        .from('users')
        .update({ organization_id: org.id, role: 'owner' })
        .eq('id', user.id);

      if (userErr) throw new Error(userErr.message);

      setOrganization(org);
      setStep('done');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <Card className="w-full max-w-md text-center" padding="lg">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-brand-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">You&apos;re all set!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your organization has been created. Taking you to your dashboard…
        </p>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <div className="mb-3 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Building2 className="h-6 w-6 text-brand-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Set up your organization</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This is where your team, agents, and policies will live.
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Organization Name"
            type="text"
            placeholder="Greenfield Farms"
            required
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            error={errors.name}
            autoFocus
          />
          <Input
            label="URL Slug"
            type="text"
            placeholder="greenfield-farms"
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            error={errors.slug}
            hint="Used in your organization URL. Lowercase letters, numbers, and hyphens only."
            leftAddon={<span className="text-xs">nutrigen.com/</span>}
          />
          <Textarea
            label="Description"
            placeholder="What does your organization do?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Create Organization
          </Button>
        </form>
      </Card>
    </div>
  );
}
