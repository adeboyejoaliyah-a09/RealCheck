import { NextResponse } from "next/server";
import { assessTransaction } from "../../../lib/detection";
import { appendAudit, record, updateStore } from "../../../lib/store";

export async function POST(request) {
  try {
    const body = await request.json();
    let transaction;
    await updateStore((state) => {
      const assessment = assessTransaction(body, state.transactions);
      transaction = record("transaction", { ...body, assessment, status: body.status || "approved" });
      state.transactions.unshift(transaction);
      if (assessment.outcome === "review") state.alerts.unshift(record("alert", { title: "Transaction anomaly detected", subject: body.transactionId, source: "Transaction", severity: assessment.riskScore >= 70 ? "high" : "medium", status: "needs_review", evidence: assessment.evidence }));
      appendAudit(state, "transaction_assessed", "transaction", transaction.id, { riskScore: assessment.riskScore });
      return state;
    });
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
