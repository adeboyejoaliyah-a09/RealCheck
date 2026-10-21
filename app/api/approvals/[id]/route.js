import { NextResponse } from "next/server";
import { transitionApproval } from "../../../../lib/workflow";

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const role = request.headers.get("x-realcheck-role");
    if (!["analyst", "supervisor"].includes(role)) {
      return NextResponse.json({ error: "A supervisor or analyst role is required." }, { status: 403 });
    }
    if (["approved", "rejected"].includes(body.status) && role !== "supervisor") {
      return NextResponse.json({ error: "Only a supervisor can approve or reject remediation." }, { status: 403 });
    }
    const approval = await transitionApproval(params.id, body.status, body.actor || "demo-analyst");
    return NextResponse.json({ approval });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
}
