export type Sentiment = 'positive' | 'negative' | 'neutral' | 'sarcastic';

export interface AnalysisResult {
  sentiment: Sentiment;
  intensity: number;
  toxicity: number;
  is_sarcastic: boolean;
  is_urgent: boolean;
  is_spam: boolean;
  spam_score: number;
  polarization_score: number;
  topic: string;
  explanation: string;
  actionable_insight: string;
  language: string;
  confidence: number;
  entities: string[];
  translated_text?: string;
  file_analysis?: string;
}

export interface Comment extends AnalysisResult {
  id: number;
  text: string;
  timestamp: string;
  parent_id?: number | null;
  replies?: Comment[];
  file_url?: string;
  file_name?: string;
  file_type?: string;
}

export interface DashboardStats {
  total: number;
  sentiment_dist: { sentiment: string; count: number }[];
  topic_dist: { topic: string; count: number }[];
  urgency_count: number;
  spam_count: number;
  avg_toxicity: number;
  avg_confidence: number;
  avg_polarization: number;
  recent_trends: { hour: string; count: number; sentiment_score: number; avg_polarization: number }[];
  language_dist: { language: string; count: number }[];
  recommendations: string[];
}
