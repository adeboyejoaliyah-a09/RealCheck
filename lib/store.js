import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const dataDirectory = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDirectory, "realcheck.json");

const emptyState = {
  alerts: [],
  investigations: [],
  documents: [],
  products: [],
  verifications: [],
  transactions: [],
  terminals: [],
  terminalEvents: [],
  recommendations: [],
  approvals: [],
  auditEvents: []
};

async function ensureStore() {
  await fs.mkdir(dataDirectory, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(emptyState, null, 2), "utf8");
  }
}

export async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf8");
  return { ...emptyState, ...JSON.parse(raw) };
}

export async function updateStore(mutator) {
  const state = await readStore();
  const nextState = await mutator(state);
  const temporaryFile = `${dataFile}.${process.pid}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(nextState, null, 2), "utf8");
  await fs.rename(temporaryFile, dataFile);
  return nextState;
}

export function record(type, values = {}) {
  return {
    id: values.id || randomUUID(),
    createdAt: values.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...values
  };
}

export function appendAudit(state, action, entityType, entityId, details = {}) {
  state.auditEvents.unshift(record("audit", {
    action,
    entityType,
    entityId,
    details
  }));
}

export { dataFile };
