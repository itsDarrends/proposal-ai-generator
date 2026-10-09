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

/**
 * Hand-maintained to match supabase/migrations. To regenerate from the live schema:
 *   npm run types:gen   (needs `npx supabase login` and `npx supabase link` first; writes types.generated.ts to diff against this file)
 */
export type Database = {
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
        Relationships: [];
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
          last_sent_at: string | null;
          send_count: number;
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
          last_sent_at?: string | null;
          send_count?: number;
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
          last_sent_at?: string | null;
          send_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "proposals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
