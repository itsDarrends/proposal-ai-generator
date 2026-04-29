import { Badge } from "@/components/ui/badge";
import type { ProposalStatus } from "@/lib/supabase/types";
import { isExpired } from "@/lib/utils";

const labels: Record<ProposalStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  paid: "Paid",
};

interface StatusBadgeProps {
  status: ProposalStatus;
  expiresAt?: string | null;
}

export function StatusBadge({ status, expiresAt }: StatusBadgeProps) {
  const expired = isExpired(expiresAt ?? null) && status !== "signed" && status !== "paid";

  if (expired) {
    return <Badge variant="expired">Expired</Badge>;
  }

  return (
    <Badge variant={status as "draft" | "sent" | "viewed" | "signed" | "paid"}>
      {labels[status]}
    </Badge>
  );
}
