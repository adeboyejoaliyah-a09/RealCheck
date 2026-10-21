import { NextResponse } from "next/server";
import { readStore } from "../../../lib/store";
import { assessTerminal } from "../../../lib/detection";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readStore();
  const terminalStats = state.terminals.map((terminal) => ({
    ...terminal,
    health: assessTerminal(state.terminalEvents.filter((event) => event.terminalId === terminal.id))
  }));
  const openAlerts = state.alerts.filter((alert) => !["resolved", "closed"].includes(alert.status));
  const reviewedDocuments = state.documents.length;
  const verifiedProducts = state.verifications.filter((item) => item.outcome === "verified").length;
  const verificationTotal = state.verifications.length;
  const totalEvents = state.terminalEvents.length;
  const failedEvents = state.terminalEvents.filter((event) => event.status === "failed").length;
  return NextResponse.json({
    synthetic: state.alerts.length === 0,
    metrics: {
      openAlerts: openAlerts.length,
      documentsReviewed: reviewedDocuments,
      verifiedProducts: verificationTotal ? verifiedProducts / verificationTotal : null,
      posAvailability: totalEvents ? 1 - failedEvents / totalEvents : null
    },
    alerts: openAlerts.slice(0, 20),
    investigations: state.investigations.slice(0, 20),
    terminals: terminalStats,
    recommendations: state.recommendations.slice(0, 20)
  });
}
