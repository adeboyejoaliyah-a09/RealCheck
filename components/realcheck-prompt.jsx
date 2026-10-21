"use client";

import { useEffect, useState } from "react";

const SYSTEM_PROMPT = `You are RealCheck, a real-time fraud decisioning engine for payment processors and fintechs.

You receive a bundle of signals about a transaction and must return a structured JSON decision.

## Your job
Analyze the signals and return one of three decisions:
- APPROVE - high confidence this is a legitimate buyer
- CHALLENGE - borderline; require a soft verification (OTP, push confirm) before proceeding
- DECLINE - high confidence this is fraud or an unacceptable risk

## Signals you will receive
- device_id: fingerprint hash (null = new/unknown device)
- ip_country: country from IP geolocation
- billing_country: country on the card
- ip_is_vpn: boolean - is the IP a known VPN/proxy?
- session_duration_seconds: how long the buyer has been on site
- attempts_last_90s: number of payment attempts in the last 90 seconds
- amount_usd: transaction amount
- email_domain_age_days: age of the email domain (low = suspicious)
- is_first_purchase: boolean
- time_of_day_local: buyer's local time (HH:MM 24h)
- prior_chargebacks: number of chargebacks from this device/email historically

## Rules of thumb (use as soft signals, not hard rules)
- VPN + new device + first purchase + high amount = strong DECLINE signal
- Multiple attempts in 90s = bot or credential stuffing = DECLINE or CHALLENGE
- Country mismatch (IP vs billing) alone is weak - many real buyers travel
- Very young email domain (<30 days) + high amount = suspicious
- Odd hours alone mean nothing - buyers are global
- Prior chargebacks > 1 = strong DECLINE signal

## Response format
Respond ONLY with a valid JSON object. No prose, no markdown, no explanation outside the JSON.

{
  "decision": "APPROVE" | "CHALLENGE" | "DECLINE",
  "confidence": 0.0-1.0,
  "reason": "One clear sentence explaining the primary driver of this decision.",
  "risk_factors": ["factor 1", "factor 2"],
  "safe_factors": ["factor 1", "factor 2"],
  "challenge_method": "OTP" | "PUSH" | "SELFIE" | null
}

challenge_method should only be non-null when decision is CHALLENGE.
confidence reflects how certain you are - borderline cases should score 0.5-0.7.`;

const USER_PROMPT = (signals) => `Evaluate this transaction:

${JSON.stringify(signals, null, 2)}`;

const presets = {
  legit: {
    label: "Likely legit",
    color: "#10b981",
    signals: {
      device_id: null,
      ip_address: "102.89.44.10",
      ip_country: "NG",
      billing_country: "NG",
      ip_is_vpn: false,
      ip_is_proxy: false,
      ip_fraud_score: 0,
      session_duration_seconds: 180,
      attempts_last_90s: 1,
      amount_usd: 49,
      email_domain_age_days: 1200,
      is_first_purchase: false,
      time_of_day_local: "14:30",
      prior_chargebacks: 0
    }
  },
  borderline: {
    label: "Borderline",
    color: "#f59e0b",
    signals: {
      device_id: null,
      ip_address: "8.8.8.8",
      ip_country: "US",
      billing_country: "NG",
      ip_is_vpn: true,
      ip_is_proxy: false,
      ip_fraud_score: 0,
      session_duration_seconds: 45,
      attempts_last_90s: 2,
      amount_usd: 299,
      email_domain_age_days: 90,
      is_first_purchase: true,
      time_of_day_local: "02:15",
      prior_chargebacks: 0
    }
  },
  fraud: {
    label: "Likely fraud",
    color: "#ef4444",
    signals: {
      device_id: null,
      ip_address: "45.142.122.90",
      ip_country: "RU",
      billing_country: "NG",
      ip_is_vpn: true,
      ip_is_proxy: true,
      ip_fraud_score: 0,
      session_duration_seconds: 8,
      attempts_last_90s: 7,
      amount_usd: 1200,
      email_domain_age_days: 3,
      is_first_purchase: true,
      time_of_day_local: "03:44",
      prior_chargebacks: 3
    }
  }
};

const decisionColors = {
  APPROVE: { bg: "#0b1724", border: "#10b981", text: "#86efac", badge: "#14532d" },
  CHALLENGE: { bg: "#1c1a12", border: "#f59e0b", text: "#fbbf24", badge: "#92400e" },
  DECLINE: { bg: "#1d1115", border: "#ef4444", text: "#fca5a5", badge: "#991b1b" }
};

export default function RealCheck() {
  const [signals, setSignals] = useState(presets.borderline.signals);
  const [visitorId, setVisitorId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activePreset, setActivePreset] = useState("borderline");
  const [rawJson, setRawJson] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeStatus, setChallengeStatus] = useState("");
  const [challengeLoading, setChallengeLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFingerprint() {
      try {
        const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
        const fp = await FingerprintJS.load();
        const { visitorId: nextVisitorId } = await fp.get();

        if (!cancelled) {
          setVisitorId(nextVisitorId);
          setSignals((prev) => ({ ...prev, device_id: nextVisitorId }));
        }
      } catch (caughtError) {
        console.error("FingerprintJS failed:", caughtError);
      }
    }

    loadFingerprint();

    return () => {
      cancelled = true;
    };
  }, []);

  const applyPreset = (key) => {
    setActivePreset(key);
    setSignals({ ...presets[key].signals, device_id: visitorId });
    setResult(null);
    setError(null);
    setChallengeOpen(false);
    setChallengeStatus("");
  };

  const updateSignal = (key, value) => {
    setSignals((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  };

  const runCheck = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    setChallengeOpen(false);
    setChallengeStatus("");

    try {
      const ipResponse = await fetch("/api/signals/ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip_address: signals.ip_address })
      });
      const ipSignals = await ipResponse.json();

      if (!ipResponse.ok) {
        throw new Error(ipSignals.error || "Failed to enrich IP signals");
      }

      const enrichedSignals = {
        ...signals,
        ...ipSignals,
        device_id: visitorId || signals.device_id
      };
      setSignals(enrichedSignals);

      const res = await fetch("/api/fraud-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: USER_PROMPT(enrichedSignals) }],
          temperature: 1
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fraud check failed");
      }

      const text = data.content?.[0]?.text ?? "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);

      if (parsed.decision === "CHALLENGE") {
        setChallengeOpen(true);
      }
    } catch (e) {
      setError(e.message || "Failed to get decision. Check your API key or network.");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    setChallengeLoading(true);
    setChallengeStatus("");

    try {
      const response = await fetch("/api/challenge/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send OTP");
      }

      setChallengeStatus("OTP sent");
    } catch (caughtError) {
      setChallengeStatus(caughtError.message || "Unable to send OTP");
    } finally {
      setChallengeLoading(false);
    }
  };

  const verifyOtp = async () => {
    setChallengeLoading(true);
    setChallengeStatus("");

    try {
      const response = await fetch("/api/challenge/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to verify OTP");
      }

      setChallengeStatus(data.verified ? "✓ Verified — transaction approved" : "✗ Code incorrect");
    } catch (caughtError) {
      setChallengeStatus(caughtError.message || "✗ Code incorrect");
    } finally {
      setChallengeLoading(false);
    }
  };

  const dc = result ? decisionColors[result.decision] : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="section-label">RealCheck Sentinel</div>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.05em] text-white">Fraud Decisioning Engine</h1>
        </div>

        <div className="flex items-center gap-2 rounded-[0.25rem] border border-[var(--border)] bg-[var(--panel-1)] p-1">
          <button className="rounded-[0.25rem] bg-[var(--primary-soft)] px-3 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-[var(--primary)]">
            Fraud intelligence
          </button>
          <button className="px-3 py-2 text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
            POS reliability
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="metric-card">
          <div className="metric-label">Portfolio risk</div>
          <div className="metric-value tabular-numbers">2.3%</div>
          <div className="mt-3">
            <span className="delta-badge delta-positive">▲ 0.4%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Avg decision time</div>
          <div className="metric-value tabular-numbers">284 ms</div>
          <div className="mt-3">
            <span className="delta-badge delta-positive">▼ 41 ms</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Chargeback exposure</div>
          <div className="metric-value tabular-numbers">$43.2k</div>
          <div className="mt-3">
            <span className="delta-badge delta-negative">▼ 12.6%</span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="surface-panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="section-label">Transaction signals</div>
            <div className="flex gap-2">
              {Object.entries(presets).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="rounded-[0.25rem] border px-2.5 py-1.5 text-[0.625rem] font-medium uppercase tracking-[0.08em]"
                  style={{
                    borderColor: activePreset === key ? p.color : "var(--border)",
                    color: activePreset === key ? p.color : "var(--text-muted)",
                    background: activePreset === key ? `${p.color}22` : "transparent"
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="signal-grid">
            {Object.entries(signals).map(([key, val]) => (
              <div key={key}>
                <div className="mb-2 text-[0.625rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">{key}</div>
                {key === "device_id" ? (
                  <input
                    value={val || "loading fingerprint..."}
                    readOnly
                    className="form-field tabular-numbers"
                  />
                ) : typeof val === "boolean" ? (
                  <select
                    value={val.toString()}
                    onChange={(e) => updateSignal(key, e.target.value === "true")}
                    className="selection-field"
                  >
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                ) : val === null ? (
                  <input
                    value="null"
                    onChange={(e) => updateSignal(key, e.target.value === "null" ? null : e.target.value)}
                    className="form-field"
                  />
                ) : typeof val === "number" ? (
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => updateSignal(key, Number(e.target.value))}
                    className="form-field tabular-numbers"
                  />
                ) : (
                  <input
                    value={val}
                    onChange={(e) => updateSignal(key, e.target.value)}
                    className="form-field"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={runCheck}
            disabled={loading}
            className="button-primary mt-6 w-full"
            style={{ opacity: loading ? 0.72 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Analyzing signals..." : "Run fraud check"}
          </button>

          {error && (
            <div className="mt-4 rounded-[0.25rem] border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.1)] p-3 text-sm text-[#fca5a5]">
              {error}
            </div>
          )}
        </div>

        <aside className="surface-panel p-5">
          <div className="section-label">Decision</div>

          {result && dc ? (
            <div className="mt-4 space-y-4" style={{ background: dc.bg, border: `1px solid ${dc.border}`, borderRadius: 6, padding: 16 }}>
              <div className="flex items-center justify-between gap-3">
                <span className="status-pill danger" style={{ background: dc.badge, borderColor: dc.border, color: "#fff" }}>
                  {result.decision}
                </span>
                {result.challenge_method && (
                  <span className="status-pill warning">{result.challenge_method}</span>
                )}
              </div>

              <div className="text-sm font-medium" style={{ color: dc.text }}>
                {Math.round(result.confidence * 100)}% confidence
              </div>

              <p className="text-sm leading-6" style={{ color: dc.text }}>
                {result.reason}
              </p>

              <div className="space-y-2">
                <div className="text-[0.625rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">Risk factors</div>
                {result.risk_factors.map((item, index) => (
                  <div key={index} className="text-sm text-[#fca5a5]">• {item}</div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="text-[0.625rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">Safe factors</div>
                {result.safe_factors.map((item, index) => (
                  <div key={index} className="text-sm text-[#86efac]">• {item}</div>
                ))}
              </div>

              <button type="button" onClick={() => setRawJson(!rawJson)} className="text-[0.625rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {rawJson ? "hide json" : "raw json"}
              </button>

              {rawJson && (
                <pre className="code-block mt-2 max-h-[220px] overflow-auto text-[0.625rem] text-[#d1d5db]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-[0.375rem] border border-dashed border-[var(--border-strong)] bg-[rgba(17,24,39,0.7)] p-4 text-sm leading-6 text-[var(--text-muted)]">
              Submit a transaction to surface a structured risk decision, confidence score, and operational guidance.
            </div>
          )}
        </aside>
      </section>

      {challengeOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
          <div className="surface-panel" style={{ width: "100%", maxWidth: 440, background: "#10101a", padding: 20 }}>
            <div className="section-label" style={{ color: "#fbbf24" }}>Soft challenge</div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              This transaction needs OTP verification before approval.
            </p>

            <div className="mt-4">
              <div className="mb-2 text-[0.625rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">Phone number</div>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+15551234567"
                className="form-field"
              />
            </div>

            <button type="button" onClick={sendOtp} disabled={challengeLoading} className="button-primary mt-4 w-full">
              {challengeLoading ? "Sending..." : "Send OTP"}
            </button>

            <div className="mt-4">
              <div className="mb-2 text-[0.625rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">Verification code</div>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                className="form-field"
              />
            </div>

            <button type="button" onClick={verifyOtp} disabled={challengeLoading} className="mt-4 w-full rounded-[0.25rem] border border-[#f59e0b] bg-[#1c1400] px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#fbbf24]">
              Verify
            </button>

            {challengeStatus && (
              <div className="mt-4 text-sm" style={{ color: challengeStatus.startsWith("✗") ? "#fca5a5" : "#86efac" }}>
                {challengeStatus}
              </div>
            )}

            <button type="button" onClick={() => setChallengeOpen(false)} className="mt-4 text-[0.625rem] uppercase tracking-[0.08em] text-[var(--text-dim)]">
              Close
            </button>
          </div>
        </div>
      )}

      <details className="mt-8 rounded-[0.375rem] border border-[var(--border)] bg-[rgba(17,24,39,0.7)] p-4">
        <summary className="cursor-pointer text-[0.625rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          View system prompt
        </summary>
        <pre className="code-block mt-4 max-h-[260px] overflow-auto whitespace-pre-wrap text-[0.625rem] text-[#8b93a7]">
          {SYSTEM_PROMPT}
        </pre>
      </details>
    </main>
  );
}
