import { NextResponse } from "next/server";
import { appendAudit, record, readStore, updateStore } from "../../../lib/store";

export async function GET() {
  const state = await readStore();
  return NextResponse.json({ products: state.products, verifications: state.verifications });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.identifier || !body.manufacturer || !body.name) throw new Error("identifier, manufacturer, and name are required.");
    let product;
    await updateStore((state) => {
      if (state.products.some((item) => item.identifier === body.identifier)) throw new Error("Product identifier is already registered.");
      product = record("product", { identifier: body.identifier, manufacturer: body.manufacturer, name: body.name, batch: body.batch || null, active: true });
      state.products.unshift(product);
      appendAudit(state, "product_registered", "product", product.id, {});
      return state;
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body.identifier) throw new Error("identifier is required.");
    let verification;
    await updateStore((state) => {
      const product = state.products.find((item) => item.identifier === body.identifier);
      const previous = state.verifications.filter((item) => item.identifier === body.identifier);
      const outcome = !product ? "unverified" : previous.length >= 2 ? "review" : "verified";
      const evidence = !product
        ? [{ code: "NOT_REGISTERED", severity: "medium", evidence: "No registered product record matched this identifier." }]
        : previous.length >= 2
          ? [{ code: "REPEATED_IDENTIFIER", severity: "high", evidence: `${previous.length + 1} verification events for this identifier.` }]
          : [{ code: "REGISTERED_MATCH", severity: "low", evidence: "Identifier matched an active server-side product record." }];
      verification = record("verification", { identifier: body.identifier, productId: product?.id || null, outcome, evidence, location: body.location || null });
      state.verifications.unshift(verification);
      if (outcome === "review") state.alerts.unshift(record("alert", { title: "Repeated product identifier", subject: body.identifier, source: "Authenticity", severity: "high", status: "needs_review", evidence }));
      appendAudit(state, "product_verified", "verification", verification.id, { outcome });
      return state;
    });
    return NextResponse.json({ verification }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
