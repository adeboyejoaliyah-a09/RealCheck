import { NextResponse } from "next/server";
import { assessTerminal } from "../../../../lib/detection";
import { appendAudit, record, updateStore } from "../../../../lib/store";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.terminalId || !["success", "failed"].includes(body.status)) throw new Error("terminalId and status (success or failed) are required.");
    let health;
    await updateStore((state) => {
      const event = record("terminal-event", { terminalId: body.terminalId, status: body.status, errorCode: body.errorCode || null });
      state.terminalEvents.unshift(event);
      let terminal = state.terminals.find((item) => item.id === body.terminalId);
      if (!terminal) {
        terminal = record("terminal", { id: body.terminalId, name: body.terminalId, location: body.location || "Unknown", status: "active" });
        state.terminals.unshift(terminal);
      }
      health = assessTerminal(state.terminalEvents.filter((item) => item.terminalId === body.terminalId));
      terminal.health = health;
      if (health.outcome === "degraded" && !state.alerts.some((item) => item.subject === body.terminalId && item.status === "needs_review")) {
        state.alerts.unshift(record("alert", { title: "Terminal failure cluster", subject: body.terminalId, source: "POS", severity: health.riskScore >= 70 ? "high" : "medium", status: "needs_review", evidence: [{ code: "FAILURE_RATE", evidence: `${Math.round(health.failureRate * 100)}% failure rate across ${health.total} events.` }] }));
      }
      appendAudit(state, "terminal_event_ingested", "terminal", body.terminalId, { status: body.status });
      return state;
    });
    return NextResponse.json({ health }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
