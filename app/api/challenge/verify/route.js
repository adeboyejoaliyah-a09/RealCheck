import { NextResponse } from "next/server";
import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const verifySid = process.env.TWILIO_VERIFY_SID?.trim();

  if (!accountSid || !authToken || !verifySid) {
    return { error: "Missing Twilio Verify env vars", verifySid: null, client: null };
  }

  return { error: null, verifySid, client: twilio(accountSid, authToken) };
}

export async function POST(request) {
  const { phone, code } = await request.json();

  if (!phone || !code) {
    return NextResponse.json({ error: "phone and code are required" }, { status: 400 });
  }

  const { error, verifySid, client } = getTwilioClient();
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  try {
    const check = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phone, code });

    return NextResponse.json({ verified: check.status === "approved", status: check.status });
  } catch (caughtError) {
    return NextResponse.json(
      { error: caughtError.message || "Unable to verify OTP" },
      { status: 500 }
    );
  }
}
