'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui';
import { clsx } from 'clsx';

const STAGES = [
  { key: 'submitted', label: 'Request submitted to blockchain' },
  { key: 'generating', label: 'AI agent generating feed formula' },
  { key: 'consensus', label: 'GenLayer validators evaluating formula' },
  { key: 'finalizing', label: 'Consensus result being recorded' },
];

interface Props {
  requestId: string;
  onComplete: (requestId: string) => void;
}

export function ConsensusProgress({ requestId, onComplete }: Props) {
  const [currentStage, setCurrentStage] = useState(0);
  const [status, setStatus] = useState<'running' | 'done' | 'failed'>('running');
  const [verdict, setVerdict] = useState<string | null>(null);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 60; // 3 min at 3s intervals

    const advance = setInterval(() => {
      if (currentStage < STAGES.length - 1) {
        setCurrentStage((s) => s + 1);
      }
    }, 8000);

    const poll = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/optimizer/poll?requestId=${requestId}`);
        const json = await res.json();
        if (json.success && json.data?.status && !['pending', 'proposing', 'committing', 'revealing'].includes(json.data.status)) {
          clearInterval(poll);
          clearInterval(advance);
          setStatus('done');
          setVerdict(json.data.consensus_status ?? json.data.status);
          setCurrentStage(STAGES.length - 1);
          setTimeout(() => onComplete(requestId), 2000);
        }
      } catch {}
      if (attempts >= maxAttempts) {
        clearInterval(poll);
        clearInterval(advance);
        setStatus('failed');
      }
    }, 3000);

    return () => { clearInterval(poll); clearInterval(advance); };
  }, [requestId, onComplete]);

  const verdictColor = verdict === 'ACCEPTED' ? 'text-green-600' : verdict === 'REJECTED' ? 'text-red-600' : 'text-orange-500';

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Consensus Validation in Progress</h2>
        <p className="text-sm text-muted-foreground mt-1">GenLayer validators are independently evaluating your feed formula.</p>
      </div>

      <Card padding="lg" className="space-y-4">
        {STAGES.map((s, i) => {
          const done = i < currentStage || status === 'done';
          const active = i === currentStage && status === 'running';
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className="shrink-0">
                {done ? <CheckCircle2 className="h-5 w-5 text-brand-600" /> :
                 active ? <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> :
                 <div className="h-5 w-5 rounded-full border-2 border-border" />}
              </div>
              <span className={clsx('text-sm', done || active ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {s.label}
              </span>
            </div>
          );
        })}

        {status === 'done' && verdict && (
          <div className={clsx('mt-2 rounded-lg border p-3 text-center text-sm font-semibold', verdictColor,
            verdict === 'ACCEPTED' ? 'bg-green-50 border-green-200' :
            verdict === 'REJECTED' ? 'bg-red-50 border-red-200' :
            'bg-orange-50 border-orange-200'
          )}>
            Consensus verdict: {verdict}
          </div>
        )}

        {status === 'failed' && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
            Validation timed out. Check the results page for updates.
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-muted-foreground">Request ID: <code className="font-mono">{requestId}</code></p>
    </div>
  );
}
