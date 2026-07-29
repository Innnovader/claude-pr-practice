// Tipos espejo del esquema en supabase/migrations/0001_init_schema.sql y 0002_saved_news.sql

export type Sentiment = "positivo" | "neutro" | "negativo";
export type ImpactLevel = "alto" | "medio" | "bajo";
export type Chamber = "senado" | "camara";
export type TerritorialOffice = "gobernacion" | "alcaldia" | "concejal" | "diputado";
export type BillStatus =
  | "radicado"
  | "primer_debate"
  | "segundo_debate"
  | "tercer_debate"
  | "cuarto_debate"
  | "conciliacion"
  | "sancionado"
  | "archivado"
  | "hundido";

export interface Parliamentarian {
  id: string;
  full_name: string;
  chamber: Chamber;
  department: string | null;
  commission: string | null;
  photo_url: string | null;
  bio: string | null;
  is_dnl_aligned: boolean;
  alignment_index: number | null;
  social_x_handle: string | null;
  social_instagram_handle: string | null;
  contact_email: string | null;
  is_mock_data: boolean;
}

export interface Bill {
  id: string;
  bill_number: string;
  title: string;
  summary: string | null;
  author_parliamentarian_id: string | null;
  rapporteur: string | null;
  status: BillStatus;
  chamber_origin: Chamber;
  dnl_relevance: ImpactLevel | null;
  topic: string | null;
  source_url: string;
  filed_at: string;
  last_action_at: string | null;
}

export interface ParliamentarianStatement {
  id: string;
  parliamentarian_id: string;
  channel: "x" | "instagram" | "boletin" | "medios" | "congreso";
  content: string;
  is_critical: boolean;
  sentiment: Sentiment | null;
  source_url: string;
  published_at: string;
}

export interface CoyunturaNews {
  id: string;
  headline: string;
  summary: string | null;
  source_name: string;
  source_url: string;
  topic: string | null;
  sentiment: Sentiment | null;
  entities: { name: string; type: "persona" | "organizacion" | "lugar" }[];
  dnl_relevance: ImpactLevel | null;
  published_at: string;
}

export interface XTweet {
  id: string;
  author_handle: string;
  author_name: string;
  author_category: "gobierno" | "oposicion" | "aliados" | "dnl_liderazgo" | "medios";
  content: string;
  tweet_url: string;
  sentiment: Sentiment | null;
  topic: string | null;
  engagement_likes: number;
  engagement_reposts: number;
  posted_at: string;
}

export interface TerritorialPower {
  id: string;
  office: TerritorialOffice;
  department: string;
  municipality: string | null;
  official_name: string;
  is_coalition: boolean;
  coalition_partners: string[] | null;
  contact_email: string | null;
  management_notes: string | null;
  is_mock_data: boolean;
}

export interface ControlAlert {
  id: string;
  source_entity: string;
  source_category: "ente_control" | "centro_pensamiento";
  title: string;
  summary: string | null;
  alert_type: string | null;
  impact_level: ImpactLevel;
  source_url: string;
  published_at: string;
}

export interface SavedNews {
  id: string;
  user_id: string;
  news_id: string;
  folder: string;
  created_at: string;
}
