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
    color: "#22c55e",
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
  APPROVE: { bg: "#052e16", border: "#16a34a", text: "#4ade80", badge: "#15803d" },
  CHALLENGE: { bg: "#1c1400", border: "#d97706", text: "#fbbf24", badge: "#b45309" },
  DECLINE: { bg: "#1c0a0a", border: "#dc2626", text: "#f87171", badge: "#b91c1c" }
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
    <div
      style={{
        fontFamily: "'DM Mono', 'Fira Code', monospace",
        background: "#0a0a0f",
        minHeight: "100vh",
        color: "#c8c8d8",
        padding: "32px 24px",
        maxWidth: 800,
        margin: "0 auto"
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 8px #6366f1" }} />
          <span style={{ fontSize: 11, color: "#6366f1", letterSpacing: 3, textTransform: "uppercase" }}>RealCheck</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f0f0ff", margin: 0, letterSpacing: -0.5 }}>
          Fraud Decisioning Engine
        </h1>
        <p style={{ fontSize: 12, color: "#555570", margin: "6px 0 0" }}>
          Adaptive / Explainable / Real-time
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {Object.entries(presets).map(([key, p]) => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: `1px solid ${activePreset === key ? p.color : "#2a2a3a"}`,
              background: activePreset === key ? p.color + "22" : "transparent",
              color: activePreset === key ? p.color : "#666680",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s"
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "#10101a",
          border: "1px solid #1e1e2e",
          borderRadius: 10,
          padding: "20px",
          marginBottom: 20
        }}
      >
        <div style={{ fontSize: 11, color: "#444460", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
          Transaction signals
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
          {Object.entries(signals).map(([key, val]) => (
            <div key={key}>
              <div style={{ fontSize: 11, color: "#555575", marginBottom: 4 }}>{key}</div>
              {key === "device_id" ? (
                <input
                  value={val || "loading fingerprint..."}
                  readOnly
                  style={{ width: "100%", background: "#0a0a14", border: "1px solid #2a2a3a", borderRadius: 5, color: "#c8c8d8", padding: "5px 8px", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }}
                />
              ) : typeof val === "boolean" ? (
                <select
                  value={val.toString()}
                  onChange={(e) => updateSignal(key, e.target.value === "true")}
                  style={{ width: "100%", background: "#0a0a14", border: "1px solid #2a2a3a", borderRadius: 5, color: "#c8c8d8", padding: "5px 8px", fontSize: 12, fontFamily: "inherit" }}
                >
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
              ) : val === null ? (
                <input
                  value="null"
                  onChange={(e) => updateSignal(key, e.target.value === "null" ? null : e.target.value)}
                  style={{ width: "100%", background: "#0a0a14", border: "1px solid #2a2a3a", borderRadius: 5, color: "#c8c8d8", padding: "5px 8px", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }}
                />
              ) : typeof val === "number" ? (
                <input
                  type="number"
                  value={val}
                  onChange={(e) => updateSignal(key, Number(e.target.value))}
                  style={{ width: "100%", background: "#0a0a14", border: "1px solid #2a2a3a", borderRadius: 5, color: "#c8c8d8", padding: "5px 8px", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }}
                />
              ) : (
                <input
                  value={val}
                  onChange={(e) => updateSignal(key, e.target.value)}
                  style={{ width: "100%", background: "#0a0a14", border: "1px solid #2a2a3a", borderRadius: 5, color: "#c8c8d8", padding: "5px 8px", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={runCheck}
        disabled={loading}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: 8,
          border: "1px solid #6366f1",
          background: loading ? "#1a1a2e" : "#6366f122",
          color: loading ? "#444460" : "#818cf8",
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          letterSpacing: 1,
          marginBottom: 20,
          transition: "all 0.15s"
        }}
      >
        {loading ? "analyzing signals..." : "RUN FRAUD CHECK"}
      </button>

      {error && (
        <div style={{ background: "#1c0a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: 16, color: "#f87171", fontSize: 12, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {result && dc && (
        <div
          style={{
            background: dc.bg,
            border: `1px solid ${dc.border}`,
            borderRadius: 10,
            padding: 24,
            animation: "fadeIn 0.3s ease"
          }}
        >
          <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }`}</style>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  padding: "4px 14px",
                  borderRadius: 4,
                  background: dc.badge,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 2
                }}
              >
                {result.decision}
              </span>
              <span style={{ fontSize: 12, color: dc.text }}>
                {Math.round(result.confidence * 100)}% confidence
              </span>
            </div>
            {result.challenge_method && (
              <span style={{ fontSize: 11, color: "#fbbf24", border: "1px solid #92400e", padding: "3px 10px", borderRadius: 4 }}>
                Challenge: {result.challenge_method}
              </span>
            )}
          </div>

          <p style={{ fontSize: 13, color: dc.text, margin: "0 0 20px", lineHeight: 1.6 }}>
            {result.reason}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: "#ef4444", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Risk factors</div>
              {result.risk_factors.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: "#fca5a5", marginBottom: 4 }}>
                  ^ {f}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#22c55e", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Safe factors</div>
              {result.safe_factors.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: "#86efac", marginBottom: 4 }}>
                  + {f}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setRawJson(!rawJson)}
            style={{
              background: "none",
              border: "none",
              color: "#444460",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
              letterSpacing: 1
            }}
          >
            {rawJson ? "hide" : "raw json"}
          </button>

          {rawJson && (
            <pre
              style={{
                marginTop: 12,
                padding: 14,
                background: "#05050f",
                borderRadius: 6,
                fontSize: 11,
                color: "#888899",
                overflow: "auto",
                maxHeight: 200
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}

      {challengeOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
          <div style={{ width: "100%", maxWidth: 440, background: "#10101a", border: "1px solid #d97706", borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: "#fbbf24", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Soft challenge</div>
            <p style={{ fontSize: 12, color: "#c8c8d8", lineHeight: 1.6, marginTop: 0 }}>
              This transaction needs OTP verification before approval.
            </p>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#555575", marginBottom: 4 }}>phone number</div>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+15551234567"
                style={{ width: "100%", background: "#0a0a14", border: "1px solid #2a2a3a", borderRadius: 5, color: "#c8c8d8", padding: "8px", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
            <button onClick={sendOtp} disabled={challengeLoading} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #6366f1", background: "#6366f122", color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: challengeLoading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 12 }}>
              Send OTP
            </button>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#555575", marginBottom: 4 }}>code</div>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                style={{ width: "100%", background: "#0a0a14", border: "1px solid #2a2a3a", borderRadius: 5, color: "#c8c8d8", padding: "8px", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
            <button onClick={verifyOtp} disabled={challengeLoading} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d97706", background: "#1c1400", color: "#fbbf24", fontSize: 12, fontWeight: 600, cursor: challengeLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              Verify
            </button>
            {challengeStatus && (
              <div style={{ marginTop: 12, color: challengeStatus.startsWith("✗") ? "#f87171" : "#86efac", fontSize: 12 }}>
                {challengeStatus}
              </div>
            )}
            <button onClick={() => setChallengeOpen(false)} style={{ marginTop: 14, background: "none", border: "none", color: "#666680", fontSize: 11, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              close
            </button>
          </div>
        </div>
      )}

      <details style={{ marginTop: 28 }}>
        <summary style={{ fontSize: 11, color: "#444460", cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>
          View system prompt
        </summary>
        <pre
          style={{
            marginTop: 12,
            padding: 16,
            background: "#10101a",
            border: "1px solid #1e1e2e",
            borderRadius: 8,
            fontSize: 11,
            color: "#666680",
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
            maxHeight: 400,
            overflow: "auto"
          }}
        >
          {SYSTEM_PROMPT}
        </pre>
      </details>
    </div>
  );
}
