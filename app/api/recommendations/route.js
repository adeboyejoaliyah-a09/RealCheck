import { NextResponse } from "next/server";
import { readStore, updateStore } from "../../../lib/store";
import { createRecommendation } from "../../../lib/workflow";

export async function GET() {
  const state = await readStore();
  return NextResponse.json({ recommendations: state.recommendations, approvals: state.approvals });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.entityType || !body.entityId || !body.reason || !body.action) {
      throw new Error("entityType, entityId, action, and reason are required.");
    }
    let recommendation;
    await updateStore((state) => {
      recommendation = createRecommendation(state, {
        entityType: body.entityType,
        entityId: body.entityId,
        action: body.action,
        reason: body.reason,
        evidence: Array.isArray(body.evidence) ? body.evidence : []
      });
      return state;
    });
    return NextResponse.json({ recommendation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
