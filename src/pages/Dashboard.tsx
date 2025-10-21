import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { Users, TrendingUp, Award, XCircle, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LeadStatusBadge from '@/components/LeadStatusBadge';
import { Link } from 'react-router-dom';

interface LeadStats {
  novo: number;
  qualificando: number;
  quente: number;
  perdido: number;
  ganho: number;
  total: number;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'novo' | 'qualificando' | 'quente' | 'perdido' | 'ganho';
  created_at: string;
}

const Dashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<LeadStats>({
    novo: 0,
    qualificando: 0,
    quente: 0,
    perdido: 0,
    ganho: 0,
    total: 0,
  });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all leads
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const newStats: LeadStats = {
        novo: 0,
        qualificando: 0,
        quente: 0,
        perdido: 0,
        ganho: 0,
        total: leads?.length || 0,
      };

      leads?.forEach((lead) => {
        if (lead.status in newStats) {
          newStats[lead.status as keyof LeadStats]++;
        }
      });

      setStats(newStats);
      setRecentLeads(leads?.slice(0, 5) || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <p>Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral dos seus leads</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total de Leads" value={stats.total} icon={Users} />
          <StatCard title="Novos" value={stats.novo} icon={UserPlus} />
          <StatCard title="Qualificando" value={stats.qualificando} icon={TrendingUp} />
          <StatCard title="Quentes" value={stats.quente} icon={TrendingUp} />
          <StatCard title="Ganhos" value={stats.ganho} icon={Award} />
        </div>

        {/* Recent Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Recentes</CardTitle>
            <CardDescription>Últimos 5 leads adicionados ao sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum lead cadastrado ainda.{' '}
                <Link to="/novo-lead" className="text-primary hover:underline">
                  Adicione o primeiro!
                </Link>
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        <Link to={`/lead/${lead.id}`} className="hover:text-primary">
                          {lead.name}
                        </Link>
                      </TableCell>
                      <TableCell>{lead.email || '-'}</TableCell>
                      <TableCell>{lead.company || '-'}</TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell>
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
