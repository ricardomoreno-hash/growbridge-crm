import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import LeadStatusBadge from '@/components/LeadStatusBadge';
import { Mail, Phone, Building2, Calendar, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: 'novo' | 'qualificando' | 'quente' | 'perdido' | 'ganho';
  notes: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
  };
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface Contact {
  id: string;
  contact_type: string;
  description: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newNote, setNewNote] = useState('');
  const [newContactType, setNewContactType] = useState('');
  const [newContactDescription, setNewContactDescription] = useState('');

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id]);

  const fetchLeadData = async () => {
    try {
      // Fetch lead
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*, profiles:responsible_id (full_name)')
        .eq('id', id)
        .single();

      if (leadError) throw leadError;
      setLead(leadData);

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('lead_notes')
        .select('*, profiles:user_id (full_name)')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('lead_contacts')
        .select('*, profiles:user_id (full_name)')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (field: string, value: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      setLead((prev) => (prev ? { ...prev, [field]: value } : null));
      
      toast({
        title: 'Lead atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { data, error } = await supabase
        .from('lead_notes')
        .insert({
          lead_id: id,
          user_id: user?.id,
          content: newNote,
        })
        .select('*, profiles:user_id (full_name)')
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNote('');
      
      toast({
        title: 'Nota adicionada',
        description: 'A nota foi salva com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar nota',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const addContact = async () => {
    if (!newContactType.trim() || !newContactDescription.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o tipo e a descrição do contato.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('lead_contacts')
        .insert({
          lead_id: id,
          user_id: user?.id,
          contact_type: newContactType,
          description: newContactDescription,
        })
        .select('*, profiles:user_id (full_name)')
        .single();

      if (error) throw error;

      setContacts([data, ...contacts]);
      setNewContactType('');
      setNewContactDescription('');
      
      toast({
        title: 'Contato registrado',
        description: 'O histórico foi atualizado.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar contato',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading || !lead) {
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
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{lead.name}</h1>
            <p className="text-muted-foreground">Detalhes do lead</p>
          </div>
          <LeadStatusBadge status={lead.status} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Lead Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={lead.name}
                  onChange={(e) => updateLead('name', e.target.value)}
                  disabled={saving}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={lead.email || ''}
                    onChange={(e) => updateLead('email', e.target.value)}
                    disabled={saving}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Telefone</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={lead.phone || ''}
                    onChange={(e) => updateLead('phone', e.target.value)}
                    disabled={saving}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Empresa</Label>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={lead.company || ''}
                    onChange={(e) => updateLead('company', e.target.value)}
                    disabled={saving}
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fonte</Label>
                <Input
                  value={lead.source || ''}
                  onChange={(e) => updateLead('source', e.target.value)}
                  disabled={saving}
                  placeholder="Ex: Site, LinkedIn"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={lead.status}
                  onValueChange={(value) => updateLead('status', value)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="qualificando">Qualificando</SelectItem>
                    <SelectItem value="quente">Quente</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                    <SelectItem value="ganho">Ganho</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações Gerais</Label>
                <Textarea
                  value={lead.notes || ''}
                  onChange={(e) => updateLead('notes', e.target.value)}
                  disabled={saving}
                  rows={4}
                  placeholder="Adicione observações sobre o lead..."
                />
              </div>

              <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Criado em: {new Date(lead.created_at).toLocaleString('pt-BR')}
                </div>
                {lead.profiles?.full_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Responsável: {lead.profiles.full_name}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes & Contacts */}
          <div className="space-y-6">
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Anotações</CardTitle>
                <CardDescription>Histórico de anotações do lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Adicionar nova anotação..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={addNote} className="w-full">
                    Adicionar Anotação
                  </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma anotação ainda
                    </p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="border-l-2 border-primary pl-3 py-2">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.profiles.full_name} •{' '}
                          {new Date(note.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contacts History */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Contatos</CardTitle>
                <CardDescription>Registro de interações com o lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Tipo de contato (ex: Ligação, Email, Reunião)"
                    value={newContactType}
                    onChange={(e) => setNewContactType(e.target.value)}
                  />
                  <Textarea
                    placeholder="Descrição do contato..."
                    value={newContactDescription}
                    onChange={(e) => setNewContactDescription(e.target.value)}
                    rows={2}
                  />
                  <Button onClick={addContact} className="w-full">
                    Registrar Contato
                  </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum contato registrado
                    </p>
                  ) : (
                    contacts.map((contact) => (
                      <div key={contact.id} className="border-l-2 border-accent pl-3 py-2">
                        <p className="text-sm font-medium">{contact.contact_type}</p>
                        <p className="text-sm text-muted-foreground">{contact.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {contact.profiles.full_name} •{' '}
                          {new Date(contact.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeadDetail;
