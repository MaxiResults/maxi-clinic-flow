import { Users } from 'lucide-react';
import { usePresenca } from '@/hooks/usePresenca';
import { PresenceBadge } from './PresenceBadge';

export function AtendentesOnlinePanel() {
  const { usuarios } = usePresenca();

  if (usuarios.length === 0) return null;

  const online = usuarios.filter((u) => u.status === 'online');
  const ausente = usuarios.filter((u) => u.status === 'ausente');
  const ordered = [...online, ...ausente];

  return (
    <div className="border-b bg-muted/30 p-3">
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <Users className="w-3.5 h-3.5" />
        <span>Equipe online ({online.length})</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {ordered.map((user) => (
          <PresenceBadge
            key={user.userId}
            status={user.status}
            lastActivity={user.lastActivity}
            nome={user.nome}
          />
        ))}
      </div>
    </div>
  );
}