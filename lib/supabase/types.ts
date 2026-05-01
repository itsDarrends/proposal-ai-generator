export type ProposalStatus = "draft" | "sent" | "viewed" | "signed" | "paid";

export interface ProposalContent {
  executiveSummary: string;
  problemStatement: string;
  proposedSolution: string;
  scopeOfWork: string;
  timeline: string;
  investment: string;
  whyUs: string;
  termsAndConditions: string;
  nextSteps: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          created_at: string;
          role: string | null;
          company_name: string | null;
          company_logo_url: string | null;
          brand_color: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          created_at?: string;
          role?: string | null;
          company_name?: string | null;
          company_logo_url?: string | null;
          brand_color?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string;
          created_at?: string;
          role?: string | null;
          company_name?: string | null;
          company_logo_url?: string | null;
          brand_color?: string | null;
        };
      };
      proposals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          client_name: string;
          client_email: string;
          content: ProposalContent;
          amount: number;
          status: ProposalStatus;
          expires_at: string | null;
          signature_data: string | null;
          stripe_checkout_session_id: string | null;
          viewed_at: string | null;
          signed_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
          view_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          client_name: string;
          client_email: string;
          content: ProposalContent;
          amount: number;
          status?: ProposalStatus;
          expires_at?: string | null;
          signature_data?: string | null;
          stripe_checkout_session_id?: string | null;
          viewed_at?: string | null;
          signed_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
          view_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          client_name?: string;
          client_email?: string;
          content?: ProposalContent;
          amount?: number;
          status?: ProposalStatus;
          expires_at?: string | null;
          signature_data?: string | null;
          stripe_checkout_session_id?: string | null;
          viewed_at?: string | null;
          signed_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
          view_count?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
