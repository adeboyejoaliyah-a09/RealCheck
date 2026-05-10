import { NextResponse } from "next/server";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

function mockDecision(payload) {
  const content = payload?.messages?.[0]?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}$/);
  const signals = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  const riskFactors = [];
  const safeFactors = [];

  if (!signals.device_id) riskFactors.push("New or unknown device");
  else safeFactors.push("Known device fingerprint");

  if (signals.ip_is_vpn) riskFactors.push("VPN or proxy IP detected");
  else safeFactors.push("No VPN or proxy signal");

  if (signals.ip_country && signals.billing_country && signals.ip_country !== signals.billing_country) {
    riskFactors.push("IP country differs from billing country");
  } else {
    safeFactors.push("IP and billing country align");
  }

  if (Number(signals.attempts_last_90s) >= 5) riskFactors.push("High payment attempt velocity");
  else safeFactors.push("Payment attempt velocity is low");

  if (Number(signals.amount_usd) >= 500) riskFactors.push("High transaction amount");
  if (Number(signals.email_domain_age_days) < 30) riskFactors.push("Very young email domain");
  if (signals.is_first_purchase) riskFactors.push("First purchase from this buyer");
  else safeFactors.push("Returning buyer");

  if (Number(signals.prior_chargebacks) > 1) riskFactors.push("Prior chargeback history");
  else safeFactors.push("No meaningful chargeback history");

  const score =
    (!signals.device_id ? 18 : 0) +
    (signals.ip_is_vpn ? 18 : 0) +
    (signals.ip_country !== signals.billing_country ? 10 : 0) +
    (Number(signals.attempts_last_90s) >= 5 ? 22 : Number(signals.attempts_last_90s) >= 2 ? 8 : 0) +
    (Number(signals.amount_usd) >= 1000 ? 18 : Number(signals.amount_usd) >= 250 ? 8 : 0) +
    (Number(signals.email_domain_age_days) < 30 ? 14 : 0) +
    (signals.is_first_purchase ? 8 : 0) +
    (Number(signals.prior_chargebacks) > 1 ? 30 : 0);

  const decision = score >= 70 ? "DECLINE" : score >= 35 ? "CHALLENGE" : "APPROVE";
  const confidence = decision === "CHALLENGE" ? 0.66 : Math.min(0.95, 0.72 + Math.abs(score - 50) / 150);

  return {
    decision,
    confidence,
    reason:
      decision === "DECLINE"
        ? "The transaction combines multiple strong fraud signals that exceed the acceptable risk threshold."
        : decision === "CHALLENGE"
          ? "The transaction has enough suspicious signals to require soft verification before approval."
          : "The transaction shows mostly trusted signals with low velocity and no meaningful chargeback history.",
    risk_factors: riskFactors,
    safe_factors: safeFactors,
    challenge_method: decision === "CHALLENGE" ? "OTP" : null
  };
}

export async function POST(request) {
  const payload = await request.json();
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (process.env.REALCHECK_MOCK === "true") {
    return NextResponse.json({
      content: [
        {
          type: "text",
          text: JSON.stringify(mockDecision(payload), null, 2)
        }
      ]
    });
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ANTHROPIC_API_KEY in .env.local. For offline demos, set REALCHECK_MOCK=true." },
      { status: 500 }
    );
  }

  if (!apiKey.startsWith("sk-ant-")) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY must be the secret key value, not an API key ID or admin API response." },
      { status: 500 }
    );
  }

  try {
    const anthropicResponse = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(payload)
    });

    const data = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Anthropic request failed", details: data },
        { status: anthropicResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to run fraud check" },
      { status: 500 }
    );
  }
}
