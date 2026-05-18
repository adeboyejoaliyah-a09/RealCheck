import { NextResponse } from "next/server";

export async function POST(request) {
  const apiKey = process.env.IPQS_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing IPQS_API_KEY in .env.local" },
      { status: 500 }
    );
  }

  try {
    const { ip_address: ipAddress } = await request.json();

    if (!ipAddress) {
      return NextResponse.json(
        { error: "ip_address is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://ipqualityscore.com/api/json/ip/${apiKey}/${encodeURIComponent(ipAddress)}`,
      { cache: "no-store" }
    );
    const data = await response.json();

    if (!response.ok || data.success === false) {
      return NextResponse.json(
        { error: data.message || "IPQS lookup failed", details: data },
        { status: response.ok ? 400 : response.status }
      );
    }

    return NextResponse.json({
      ip_is_vpn: Boolean(data.vpn),
      ip_is_proxy: Boolean(data.proxy),
      ip_country: data.country_code || "",
      ip_fraud_score: Number(data.fraud_score ?? 0)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to fetch IPQS signals" },
      { status: 500 }
    );
  }
}
