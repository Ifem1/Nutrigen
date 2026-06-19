'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button, Input, Textarea, Card, CardHeader, CardTitle } from '@/components/ui';
import { useCreateAgent } from '@/hooks/useAgents';

export default function NewAgentPage() {
  const router = useRouter();
  const create = useCreateAgent();
  const [form, setForm] = useState({ name: '', description: '', agent_type: 'feed_optimizer' });
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Agent name is required.'); return; }
    await create.mutateAsync(form);
    router.push('/agents');
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push('/agents')}>Back</Button>
      </div>
      <h2 className="text-xl font-bold text-foreground">Register New Agent</h2>

      <Card padding="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Agent Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={error} placeholder="Feed Optimizer Agent v1" autoFocus />
          <Input label="Agent Type" value={form.agent_type} onChange={(e) => setForm({ ...form, agent_type: e.target.value })} placeholder="feed_optimizer" hint="Identifier for the agent's role (e.g. feed_optimizer, growth_analyzer)" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this agent do?" rows={3} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.push('/agents')}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Register Agent</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
