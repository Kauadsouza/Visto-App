/**
 * Tipos do banco, espelhando as migrations em supabase/migrations/.
 *
 * Mantidos à mão de propósito: quando o projeto no Supabase existir, rode
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 * e este arquivo é substituído pelo gerado — que é sempre a fonte da verdade.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Fase do checklist, na ordem em que o usuário executa. */
export type FasePlano = 'preparacao' | 'documentos' | 'aplicacao' | 'aguardando' | 'depois';

/** Forma do objeto `item` dentro de public.planos.item. */
export interface ItemPlano {
  titulo: string;
  descricao: string;
  fase: FasePlano;
  /** Ex.: "semana 1", "após aprovação". Texto livre — muda por rota. */
  prazo: string;
  /** Estimativa em BRL. 0 quando o passo não custa dinheiro. */
  custo: number;
}

export type StatusAssinatura = 'inativa' | 'ativa' | 'cancelada' | 'inadimplente';

export interface Profile {
  id: string;
  email: string;
  nome: string | null;
  respostas: Json;
  diagnostico: Json | null;
  created_at: string;
  updated_at: string;
}

export interface Plano {
  id: string;
  user_id: string;
  rota_slug: string;
  item: ItemPlano;
  concluido: boolean;
  ordenacao: number;
  created_at: string;
}

export interface Assinatura {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: StatusAssinatura;
  current_period_end: string | null;
  created_at: string;
}

export interface RegistroViagem {
  id: string;
  user_id: string;
  pais: string;
  data_entrada: string;
  data_saida: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at' | 'updated_at'> & Partial<Pick<Profile, 'created_at' | 'updated_at'>>; Update: Partial<Profile>; Relationships: [] };
      planos: { Row: Plano; Insert: Omit<Plano, 'id' | 'created_at' | 'concluido'> & Partial<Pick<Plano, 'id' | 'created_at' | 'concluido'>>; Update: Partial<Plano>; Relationships: [] };
      assinaturas: { Row: Assinatura; Insert: Omit<Assinatura, 'id' | 'created_at'> & Partial<Pick<Assinatura, 'id' | 'created_at'>>; Update: Partial<Assinatura>; Relationships: [] };
      registros_viagem: { Row: RegistroViagem; Insert: Omit<RegistroViagem, 'id' | 'created_at'> & Partial<Pick<RegistroViagem, 'id' | 'created_at'>>; Update: Partial<RegistroViagem>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}