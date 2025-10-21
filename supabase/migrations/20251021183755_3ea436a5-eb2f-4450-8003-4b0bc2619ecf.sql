-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar enum para status de leads
CREATE TYPE public.lead_status AS ENUM ('novo', 'qualificando', 'quente', 'perdido', 'ganho');

-- Criar tabela de leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT,
  status public.lead_status DEFAULT 'novo',
  notes TEXT,
  responsible_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas para leads (todos usuários autenticados podem ver e gerenciar)
CREATE POLICY "Authenticated users can view leads"
ON public.leads FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (true);

-- Criar tabela de anotações de leads
CREATE TABLE public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela lead_notes
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Políticas para lead_notes
CREATE POLICY "Authenticated users can view lead notes"
ON public.lead_notes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create lead notes"
ON public.lead_notes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Criar tabela de histórico de contatos
CREATE TABLE public.lead_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  contact_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela lead_contacts
ALTER TABLE public.lead_contacts ENABLE ROW LEVEL SECURITY;

-- Políticas para lead_contacts
CREATE POLICY "Authenticated users can view lead contacts"
ON public.lead_contacts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create lead contacts"
ON public.lead_contacts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhorar performance
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_responsible ON public.leads(responsible_id);
CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX idx_lead_contacts_lead_id ON public.lead_contacts(lead_id);