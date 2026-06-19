'use client';

import Link from 'next/link';
import { Plus, Bot, Activity, PauseCircle, XCircle } from 'lucide-react';
import { Button, Card, Badge, Spinner } from '@/components/ui';
import { useAgents, useUpdateAgentStatus } from '@/hooks/useAgents';
import { formatDistanceToNow } from 'date-fns';

const STATUS_ICON: Record<string, React.ReactNode> = {
  active: <Activity className="h-4 w-4 text-green-500" />,
  inactive: <PauseCircle className="h-4 w-4 text-muted-foreground" />,
  suspended: <XCircle className="h-4 w-4 text-red-500" />,
};

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const updateStatus = useUpdateAgentStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Agent Management</h2>
          <p className="text-sm text-muted-foreground">Registered AI agents that submit optimization requests.</p>
        </div>
        <Link href="/agents/new"><Button leftIcon={<Plus className="h-4 w-4" />}>Register Agent</Button></Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !agents?.length ? (
        <Card padding="lg" className="text-center py-16">
          <Bot className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No agents registered yet.</p>
          <Link href="/agents/new" className="mt-4 inline-block">
            <Button size="sm">Register first agent</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a: any) => (
            <Card key={a.id} padding="md" className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50">
                    <Bot className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.agent_type}</p>
                  </div>
                </div>
                {STATUS_ICON[a.status]}
              </div>

              {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Total', value: a.total_requests },
                  { label: 'Success', value: a.successful_requests },
                  { label: 'Failed', value: a.failed_requests },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-md bg-secondary/60 py-2">
                    <p className="text-sm font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {a.last_active_at && (
                <p className="text-xs text-muted-foreground">
                  Last active: {formatDistanceToNow(new Date(a.last_active_at), { addSuffix: true })}
                </p>
              )}

              <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                <Link href={`/agents/${a.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">View</Button>
                </Link>
                {a.status === 'active' ? (
                  <Button variant="ghost" size="sm" onClick={() => updateStatus.mutate({ id: a.id, status: 'suspended' })}>
                    Suspend
                  </Button>
                ) : a.status === 'suspended' ? (
                  <Button variant="ghost" size="sm" onClick={() => updateStatus.mutate({ id: a.id, status: 'active' })}>
                    Reinstate
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
