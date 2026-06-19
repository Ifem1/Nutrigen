'use client';

import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardTitle, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty, Select, Spinner, Badge } from '@/components/ui';
import { useTeamMembers, useUpdateUserRole } from '@/hooks/useOrganization';
import { useAuthStore } from '@/store/authStore';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'viewer', label: 'Viewer' },
];

const ROLE_COLORS: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
  owner: 'default', admin: 'success', manager: 'warning', viewer: 'secondary',
};

export default function AdminPage() {
  const { data: members, isLoading } = useTeamMembers();
  const updateRole = useUpdateUserRole();
  const { user, profile } = useAuthStore();

  if (profile && profile.role !== 'admin' && profile.role !== 'owner') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-foreground">Access Denied</p>
        <p className="mt-1 text-sm text-muted-foreground">You need admin or owner privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
        <p className="text-sm text-muted-foreground">Manage team members and their roles.</p>
      </div>

      <Card padding="none">
        <CardHeader className="border-b border-border px-5 py-4"><CardTitle>Team Members</CardTitle></CardHeader>
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Change Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!members?.length ? (
                <TableEmpty colSpan={6} message="No team members." />
              ) : members.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.full_name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{m.email}</TableCell>
                  <TableCell><Badge variant={ROLE_COLORS[m.role] ?? 'secondary'} size="sm">{m.role}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={m.is_active ? 'success' : 'secondary'} dot size="sm">
                      {m.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</TableCell>
                  <TableCell>
                    {m.id !== user?.id ? (
                      <Select
                        options={ROLE_OPTIONS}
                        value={m.role}
                        onChange={(e) => updateRole.mutate({ userId: m.id, role: e.target.value })}
                        wrapperClassName="w-32"
                      />
                    ) : <span className="text-xs text-muted-foreground">You</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
