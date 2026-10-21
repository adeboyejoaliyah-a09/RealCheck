import { appendAudit, record, updateStore } from "./store.js";

export const approvalStates = ["pending", "approved", "rejected", "execution_in_progress", "completed", "failed"];
const transitions = {
  pending: ["approved", "rejected"],
  approved: ["execution_in_progress"],
  rejected: [],
  execution_in_progress: ["completed", "failed"],
  completed: [],
  failed: []
};

export async function transitionApproval(id, nextState, actor = "demo-analyst") {
  if (!approvalStates.includes(nextState)) throw new Error("Invalid approval state.");
  let result;
  await updateStore((state) => {
    const approval = state.approvals.find((item) => item.id === id);
    if (!approval) throw new Error("Approval not found.");
    if (!transitions[approval.status].includes(nextState)) throw new Error(`Cannot move approval from ${approval.status} to ${nextState}.`);
    const previousState = approval.status;
    approval.status = nextState;
    approval.updatedAt = new Date().toISOString();
    result = { ...approval };
    appendAudit(state, "approval_state_changed", "approval", id, { actor, from: previousState, to: nextState });
    if (nextState === "execution_in_progress") {
      approval.execution = "simulated";
      appendAudit(state, "simulated_remediation_started", approval.entityType, approval.entityId, { actor });
      approval.status = "completed";
      appendAudit(state, "simulated_remediation_completed", approval.entityType, approval.entityId, { actor });
      result = { ...approval };
    }
    return state;
  });
  return result;
}

export function createRecommendation(state, values) {
  const recommendation = record("recommendation", { ...values, status: "pending" });
  state.recommendations.unshift(recommendation);
  state.approvals.unshift(record("approval", {
    entityType: "recommendation",
    entityId: recommendation.id,
    recommendationId: recommendation.id,
    status: "pending",
    execution: "simulated"
  }));
  appendAudit(state, "recommendation_created", "recommendation", recommendation.id, { reason: recommendation.reason });
  return recommendation;
}
