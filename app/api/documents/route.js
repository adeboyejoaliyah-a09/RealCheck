import { NextResponse } from "next/server";
import { analyzeDocument } from "../../../lib/detection";
import { appendAudit, record, updateStore } from "../../../lib/store";

export const runtime = "nodejs";

export async function GET() {
  const { readStore } = await import("../../../lib/store");
  const state = await readStore();
  return NextResponse.json({ documents: state.documents });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const analysis = await analyzeDocument(file);
    let document;
    await updateStore((state) => {
      const duplicate = state.documents.find((item) => item.sha256 === analysis.sha256);
      document = record("document", {
        fileName: file.name,
        category: String(formData.get("category") || "supporting"),
        status: analysis.outcome,
        ...analysis,
        duplicateOf: duplicate?.id || null
      });
      state.documents.unshift(document);
      if (duplicate) {
        state.alerts.unshift(record("alert", {
          title: "Repeated document submission",
          subject: file.name,
          source: "Document",
          severity: "high",
          status: "needs_review",
          evidence: [{ code: "DUPLICATE_HASH", evidence: `Matches ${duplicate.id}` }]
        }));
      }
      appendAudit(state, "document_analyzed", "document", document.id, { outcome: analysis.outcome });
      return state;
    });
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to analyze document." }, { status: 400 });
  }
}
