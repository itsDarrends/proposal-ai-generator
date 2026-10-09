import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createServiceClient } from "@/lib/supabase/server";
import { generateProposalPDF } from "@/lib/pdf";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();


  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfBuffer = await generateProposalPDF({
    title: proposal.title,
    clientName: proposal.client_name,
    amount: proposal.amount,
    createdAt: proposal.created_at,
    expiresAt: proposal.expires_at,
    content: proposal.content,
    signatureData: proposal.signature_data,
    signedAt: proposal.signed_at,
  });

  const filename = `proposal-${proposal.title.toLowerCase().replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  });
}
