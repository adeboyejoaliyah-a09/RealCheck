import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { analyzeDocument, assessTerminal, assessTransaction } from "../lib/detection.js";
import { dataFile, readStore, updateStore } from "../lib/store.js";
import { createRecommendation, transitionApproval } from "../lib/workflow.js";

test("transaction assessment detects duplicate identifiers and velocity", () => {
  const now = new Date().toISOString();
  const history = [
    { transactionId: "old-1", customerId: "customer-1", amount: 10, createdAt: now },
    { transactionId: "old-2", customerId: "customer-1", amount: 12, createdAt: now },
    { transactionId: "old-3", customerId: "customer-1", amount: 11, createdAt: now }
  ];
  const result = assessTransaction({ transactionId: "old-1", customerId: "customer-1", amount: 80 }, history);
  assert.equal(result.outcome, "review");
  assert.deepEqual(result.evidence.map((item) => item.code), ["VELOCITY_SPIKE", "DUPLICATE_ATTEMPT", "UNUSUAL_AMOUNT"]);
});

test("transaction assessment does not flag a normal first transaction", () => {
  const result = assessTransaction({ transactionId: "new-1", customerId: "customer-2", amount: 20 }, []);
  assert.equal(result.outcome, "clear");
  assert.equal(result.evidence.length, 0);
});

test("terminal assessment calculates failure rate from events", () => {
  const result = assessTerminal([
    { status: "success" },
    { status: "failed" },
    { status: "failed" },
    { status: "success" }
  ]);
  assert.equal(result.total, 4);
  assert.equal(result.failures, 2);
  assert.equal(result.failureRate, 0.5);
  assert.equal(result.outcome, "degraded");
});

test("document analysis rejects a mismatched binary signature", async () => {
  const file = {
    name: "statement.pdf",
    type: "application/pdf",
    size: 4,
    arrayBuffer: async () => Uint8Array.from([1, 2, 3, 4]).buffer
  };
  const result = await analyzeDocument(file);
  assert.equal(result.findings[0].code, "FILE_SIGNATURE_MISMATCH");
  assert.equal(result.outcome, "review");
});

test("recommendations persist and simulated approvals are auditable", async () => {
  await fs.rm(dataFile, { force: true });
  await updateStore((state) => {
    createRecommendation(state, {
      entityType: "transaction",
      entityId: "txn-test",
      action: "challenge",
      reason: "Repeated payment attempts",
      evidence: [{ code: "VELOCITY_SPIKE" }]
    });
    return state;
  });
  const pending = await readStore();
  const approvalId = pending.approvals[0].id;
  const completed = await transitionApproval(approvalId, "approved", "test-analyst");
  assert.equal(completed.status, "approved");
  const execution = await transitionApproval(approvalId, "execution_in_progress", "test-analyst");
  assert.equal(execution.status, "completed");
  const finalState = await readStore();
  assert.equal(finalState.auditEvents.length >= 4, true);
  await fs.rm(dataFile, { force: true });
});
