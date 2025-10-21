import { Badge } from '@/components/ui/badge';

type LeadStatus = 'novo' | 'qualificando' | 'quente' | 'perdido' | 'ganho';

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

const statusConfig = {
  novo: { label: 'Novo', className: 'bg-info text-info-foreground' },
  qualificando: { label: 'Qualificando', className: 'bg-warning text-warning-foreground' },
  quente: { label: 'Quente', className: 'bg-primary text-primary-foreground' },
  perdido: { label: 'Perdido', className: 'bg-destructive text-destructive-foreground' },
  ganho: { label: 'Ganho', className: 'bg-success text-success-foreground' },
};

const LeadStatusBadge = ({ status }: LeadStatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.novo;
  
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};

export default LeadStatusBadge;
