import crypto from "node:crypto";

const supportedTypes = new Set(["application/pdf", "image/png", "image/jpeg"]);
const extensions = new Set([".pdf", ".png", ".jpg", ".jpeg"]);

export function validateDocument(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("A document file is required.");
  }
  const extension = `.${String(file.name || "").split(".").pop()?.toLowerCase()}`;
  if (!extensions.has(extension)) throw new Error("Only PDF, PNG, and JPEG files are supported.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Document exceeds the 10 MB limit.");
  if (file.size === 0) throw new Error("Document is empty.");
  return extension;
}

function hasSignature(buffer, extension) {
  if (extension === ".pdf") return buffer.subarray(0, 5).toString() === "%PDF-";
  if (extension === ".png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
}

function extractPdfText(buffer) {
  if (buffer.subarray(0, 5).toString() !== "%PDF-") return "";
  return buffer.toString("latin1")
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "")
    .match(/\(([^()\r\n]{2,})\)/g)?.map((value) => value.slice(1, -1)).join(" ") || "";
}

export async function analyzeDocument(file) {
  const extension = validateDocument(file);
  const bytes = Buffer.from(await file.arrayBuffer());
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  const findings = [];
  const limitations = ["No OCR provider is configured; image text and scanned PDF content are not interpreted."];

  if (!hasSignature(bytes, extension)) {
    findings.push({ code: "FILE_SIGNATURE_MISMATCH", severity: "high", confidence: 0.99, evidence: "File extension does not match its binary signature." });
  }
  if (extension === ".pdf" && !extractPdfText(bytes)) {
    findings.push({ code: "NO_EXTRACTABLE_TEXT", severity: "low", confidence: 0.98, evidence: "The PDF has no plain text stream available to the local analyzer." });
  }
  if (bytes.includes(Buffer.from("/JavaScript")) || bytes.includes(Buffer.from("/JS"))) {
    findings.push({ code: "EMBEDDED_SCRIPT", severity: "medium", confidence: 0.96, evidence: "The PDF contains an embedded JavaScript marker." });
  }
  const riskScore = Math.min(100, findings.reduce((total, finding) => total + (finding.severity === "high" ? 55 : finding.severity === "medium" ? 30 : 8), 0));
  return {
    sha256,
    mimeType: file.type || "application/octet-stream",
    size: bytes.length,
    extractedText: extension === ".pdf" ? extractPdfText(bytes).slice(0, 20000) : "",
    findings,
    limitations,
    riskScore,
    outcome: riskScore >= 60 ? "review" : "no_high_risk_evidence"
  };
}

export function assessTransaction(input, history = []) {
  const amount = Number(input.amount);
  if (!input.transactionId || !Number.isFinite(amount) || amount < 0) throw new Error("transactionId and a non-negative amount are required.");
  const sameCustomer = history.filter((item) => item.customerId && item.customerId === input.customerId);
  const recent = sameCustomer.filter((item) => Date.now() - Date.parse(item.createdAt) < 90_000);
  const evidence = [];
  if (recent.length >= 3) evidence.push({ code: "VELOCITY_SPIKE", severity: "high", confidence: 0.97, evidence: `${recent.length + 1} attempts for the same customer within 90 seconds.` });
  if (history.some((item) => item.transactionId === input.transactionId)) evidence.push({ code: "DUPLICATE_ATTEMPT", severity: "high", confidence: 1, evidence: "Transaction identifier already exists." });
  const customerAmounts = sameCustomer.map((item) => Number(item.amount)).filter(Number.isFinite);
  const baseline = customerAmounts.length ? customerAmounts.reduce((a, b) => a + b, 0) / customerAmounts.length : 0;
  if (baseline > 0 && amount > baseline * 5) evidence.push({ code: "UNUSUAL_AMOUNT", severity: "medium", confidence: 0.88, evidence: `Amount is more than five times the customer's historical average (${baseline.toFixed(2)}).` });
  if (input.status === "failed") {
    const failures = recent.filter((item) => item.status === "failed").length;
    if (failures >= 2) evidence.push({ code: "REPEATED_FAILURES", severity: "medium", confidence: 0.94, evidence: `${failures + 1} failed attempts in the current window.` });
  }
  const riskScore = Math.min(100, evidence.reduce((total, item) => total + (item.severity === "high" ? 40 : 22), 0));
  return { riskScore, evidence, outcome: riskScore >= 60 ? "review" : "clear", baseline };
}

export function assessTerminal(events) {
  const total = events.length;
  const failures = events.filter((event) => event.status === "failed").length;
  const failureRate = total ? failures / total : 0;
  const riskScore = Math.round(Math.min(100, failureRate * 100 + (failures >= 3 ? 20 : 0)));
  return { total, failures, failureRate, riskScore, outcome: riskScore >= 35 ? "degraded" : "healthy" };
}
