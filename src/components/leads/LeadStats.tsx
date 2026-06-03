import { Users, UserPlus, UserCheck, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LeadStatsProps {
  stats: {
    total: number;
    novos: number;
    qualificados: number;
    convertidos: number;
    taxaConversao: number;
  };
  loading?: boolean;
}

export function LeadStats({ stats, loading }: LeadStatsProps) {
  const items = [
    { label: 'Total de Leads', value: stats.total,         icon: Users,      color: '#6366F1', suffix: ''  },
    { label: 'Novos',          value: stats.novos,         icon: UserPlus,   color: '#3B82F6', suffix: ''  },
    { label: 'Qualificados',   value: stats.qualificados,  icon: UserCheck,  color: '#F59E0B', suffix: ''  },
    { label: 'Conversão',      value: stats.taxaConversao, icon: TrendingUp, color: '#10B981', suffix: '%' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {items.map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {items.map(({ label, value, icon: Icon, color, suffix }, idx) => (
        <div
          key={label}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
            <div
              className="p-2 rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${color}18` }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
            {value}{suffix}
          </p>
          {label === 'Conversão' && (
            <p className="text-[10px] text-gray-400 mt-1">
              {stats.convertidos} convertidos
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
