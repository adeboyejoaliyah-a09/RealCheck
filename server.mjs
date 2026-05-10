import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.PORT || 3000);
const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

loadEnv();

function loadEnv() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error("Request body too large"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function extractSignals(payload) {
  const content = payload?.messages?.[0]?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}$/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
}

function mockDecision(payload) {
  const signals = extractSignals(payload);
  const riskFactors = [];
  const safeFactors = [];

  if (!signals.device_id) riskFactors.push("New or unknown device");
  else safeFactors.push("Known device fingerprint");

  if (signals.ip_is_vpn) riskFactors.push("VPN or proxy IP detected");
  else safeFactors.push("No VPN or proxy signal");

  if (signals.ip_country && signals.billing_country && signals.ip_country !== signals.billing_country) riskFactors.push("IP country differs from billing country");
  else safeFactors.push("IP and billing country align");

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
    reason: decision === "DECLINE"
      ? "The transaction combines multiple strong fraud signals that exceed the acceptable risk threshold."
      : decision === "CHALLENGE"
        ? "The transaction has enough suspicious signals to require soft verification before approval."
        : "The transaction shows mostly trusted signals with low velocity and no meaningful chargeback history.",
    risk_factors: riskFactors,
    safe_factors: safeFactors,
    challenge_method: decision === "CHALLENGE" ? "OTP" : null
  };
}

async function handleFraudCheck(req, res) {
  try {
    const payload = JSON.parse(await readBody(req));
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (process.env.REALCHECK_MOCK === "true") {
      return json(res, 200, { content: [{ type: "text", text: JSON.stringify(mockDecision(payload), null, 2) }] });
    }

    if (!apiKey) return json(res, 500, { error: "Missing ANTHROPIC_API_KEY in .env.local. For offline demos, set REALCHECK_MOCK=true." });
    if (!apiKey.startsWith("sk-ant-")) return json(res, 500, { error: "ANTHROPIC_API_KEY must be the secret key value, not an API key ID." });

    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return json(res, response.status, data);
  } catch (error) {
    return json(res, 500, { error: error.message || "Unable to run fraud check" });
  }
}

const css = `*{box-sizing:border-box}body{margin:0;background:#0a0a0f;color:#f7f7fb;font-family:'DM Mono','Fira Code',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}a{color:inherit;text-decoration:none}.wrap{width:min(1120px,calc(100% - 40px));margin:0 auto}.nav{display:flex;align-items:center;justify-content:space-between;padding:24px 0}.brand{font-size:14px;font-weight:700;letter-spacing:.28em;text-transform:uppercase}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid #6366f1;background:#6366f1;color:#fff;padding:12px 20px;font-size:13px;font-weight:700}.button.secondary{background:transparent;color:#c7d2fe}.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center;padding:72px 0 64px}.eyebrow{display:inline-flex;border:1px solid #26263a;background:#101019;color:#c7d2fe;padding:8px 12px;font-size:11px;letter-spacing:.22em;text-transform:uppercase}h1{margin:20px 0 0;color:#fff;font-size:clamp(44px,8vw,78px);line-height:1.02;letter-spacing:0}.lede{max-width:680px;margin:24px 0 0;color:#d4d4d8;font-size:18px;line-height:1.7}.hero-actions{display:flex;flex-wrap:wrap;align-items:center;gap:16px;margin-top:36px}.muted{color:#71717a;font-size:13px}.panel,.card{border:1px solid #26263a;background:#101019}.bar{display:flex;justify-content:space-between;border-bottom:1px solid #26263a;padding:12px 16px;color:#71717a;font-size:12px}pre{margin:0;overflow:auto;padding:20px;color:#e4e4e7;font-size:13px;line-height:1.7}.features{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding-bottom:80px}.card{padding:22px}.stat{color:#a5b4fc;font-size:11px;letter-spacing:.22em;margin-bottom:32px;text-transform:uppercase}h2{margin:0;color:#fff;font-size:20px}.copy{color:#a1a1aa;font-size:14px;line-height:1.7}.demo{width:min(800px,calc(100% - 40px));margin:0 auto;padding:28px 0 80px}.demo-title{display:flex;align-items:center;gap:10px;color:#6366f1;font-size:11px;letter-spacing:3px;text-transform:uppercase}.dot{width:10px;height:10px;border-radius:50%;background:#6366f1;box-shadow:0 0 8px #6366f1}.presets{display:flex;gap:8px;margin:24px 0}.preset{border:1px solid #2a2a3a;border-radius:6px;background:transparent;color:#666680;padding:6px 14px;font:inherit;font-size:12px;cursor:pointer}.signals{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;border:1px solid #1e1e2e;border-radius:10px;background:#10101a;padding:20px}label{display:block;color:#555575;font-size:11px;margin-bottom:4px}input,select{width:100%;border:1px solid #2a2a3a;border-radius:5px;background:#0a0a14;color:#c8c8d8;padding:6px 8px;font:inherit;font-size:12px}.run{width:100%;margin:20px 0;border:1px solid #6366f1;border-radius:8px;background:#6366f122;color:#818cf8;padding:13px;font:inherit;font-size:13px;font-weight:700;letter-spacing:1px;cursor:pointer}.result{border:1px solid #26263a;border-radius:10px;background:#101019;padding:24px;white-space:pre-wrap}.error{border-color:#7f1d1d;background:#1c0a0a;color:#f87171}.badge{display:inline-flex;border-radius:4px;color:#fff;padding:4px 14px;font-size:13px;font-weight:700;letter-spacing:2px}.split{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:820px){.hero,.features,.signals,.split{grid-template-columns:1fr}}`;

function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><style>${css}</style></head><body>${body}</body></html>`;
}

function landing() {
  return page("RealCheck", `<header class="wrap nav"><a class="brand" href="/">RealCheck</a><a class="button secondary" href="/demo">Live demo</a></header><main><section class="wrap hero"><div><span class="eyebrow">Adaptive fraud decisioning</span><h1>Stop blocking real customers.</h1><p class="lede">RealCheck gives fintechs and payment processors explainable, adaptive fraud decisions that separate risky behavior from legitimate urgency.</p><div class="hero-actions"><a class="button" href="/demo">Run fraud check</a><span class="muted">API-first. No black box declines.</span></div></div><div class="panel"><div class="bar"><span>realcheck.js</span><span style="color:#a5b4fc">POST /v1/decisions</span></div><pre><code>const decision = await realcheck.decide({\n  user_id: "usr_9281",\n  amount: 248.90,\n  currency: "USD",\n  payment_method: "card",\n  device: request.device,\n  signals: request.riskSignals\n});\n\nif (decision.action === "challenge") {\n  return startSoftChallenge(decision.reason_codes);\n}</code></pre></div></section><section class="wrap features"><article class="card"><div class="stat">&lt; 400ms</div><h2>Real-time decisions</h2><p class="copy">Return approve, block, or challenge decisions before checkout latency becomes a product problem.</p></article><article class="card"><div class="stat">5 reasons</div><h2>Explainable reasons</h2><p class="copy">Every response includes readable signals, confidence, and next best action for risk and ops teams.</p></article><article class="card"><div class="stat">adaptive</div><h2>Soft challenge flow</h2><p class="copy">Route uncertain sessions into low-friction verification instead of rejecting good customers.</p></article></section></main>`);
}

function demo() {
  return page("RealCheck Demo", `<header class="wrap nav"><a class="brand" href="/">RealCheck</a><a class="button secondary" href="/">Back</a></header><main class="demo"><div class="demo-title"><span class="dot"></span><span>RealCheck</span></div><h1 style="font-size:24px;margin-top:8px">Fraud Decisioning Engine</h1><p class="muted">Adaptive / Explainable / Real-time</p><div class="presets"><button class="preset" data-preset="legit">Likely legit</button><button class="preset" data-preset="borderline">Borderline</button><button class="preset" data-preset="fraud">Likely fraud</button></div><div id="signals" class="signals"></div><button id="run" class="run">RUN FRAUD CHECK</button><div id="output" class="result">Awaiting transaction assessment...</div></main><script>${clientJs()}</script>`);
}

function clientJs() {
  return `const SYSTEM_PROMPT = ${JSON.stringify(`You are RealCheck, a real-time fraud decisioning engine for payment processors and fintechs. Respond ONLY with a valid JSON object containing decision, confidence, reason, risk_factors, safe_factors, and challenge_method.`)};const presets={legit:{device_id:"fp_a3f9d2c1",ip_country:"NG",billing_country:"NG",ip_is_vpn:false,session_duration_seconds:180,attempts_last_90s:1,amount_usd:49,email_domain_age_days:1200,is_first_purchase:false,time_of_day_local:"14:30",prior_chargebacks:0},borderline:{device_id:null,ip_country:"US",billing_country:"NG",ip_is_vpn:true,session_duration_seconds:45,attempts_last_90s:2,amount_usd:299,email_domain_age_days:90,is_first_purchase:true,time_of_day_local:"02:15",prior_chargebacks:0},fraud:{device_id:null,ip_country:"RU",billing_country:"NG",ip_is_vpn:true,session_duration_seconds:8,attempts_last_90s:7,amount_usd:1200,email_domain_age_days:3,is_first_purchase:true,time_of_day_local:"03:44",prior_chargebacks:3}};let signals={...presets.borderline};const box=document.getElementById("signals");const output=document.getElementById("output");function render(){box.innerHTML="";Object.entries(signals).forEach(([k,v])=>{const div=document.createElement("div");const label=document.createElement("label");label.textContent=k;div.appendChild(label);let input;if(typeof v==="boolean"){input=document.createElement("select");input.innerHTML='<option value="false">false</option><option value="true">true</option>';input.value=String(v);input.onchange=e=>{signals[k]=e.target.value==="true"}}else{input=document.createElement("input");input.value=v===null?"null":v;input.type=typeof v==="number"?"number":"text";input.oninput=e=>{signals[k]=v===null&&e.target.value==="null"?null:typeof v==="number"?Number(e.target.value):e.target.value}}div.appendChild(input);box.appendChild(div)})}document.querySelectorAll(".preset").forEach(btn=>btn.onclick=()=>{signals={...presets[btn.dataset.preset]};output.className="result";output.textContent="Awaiting transaction assessment...";render()});document.getElementById("run").onclick=async()=>{output.className="result";output.textContent="Analyzing signals...";try{const res=await fetch("/api/fraud-check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-opus-4-6",max_tokens:1024,temperature:1,system:SYSTEM_PROMPT,messages:[{role:"user",content:"Evaluate this transaction:\\n\\n"+JSON.stringify(signals,null,2)}]})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Fraud check failed");const text=data.content?.[0]?.text||JSON.stringify(data,null,2);const cleaned=text.trim();const jsonText=cleaned.startsWith("{")?cleaned:cleaned.slice(cleaned.indexOf("{"),cleaned.lastIndexOf("}")+1);const parsed=JSON.parse(jsonText);output.textContent=JSON.stringify(parsed,null,2)}catch(e){output.className="result error";output.textContent=e.message}};render();`;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  if (req.method === "POST" && url.pathname === "/api/fraud-check") return handleFraudCheck(req, res);
  if (req.method === "GET" && url.pathname === "/demo") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(demo());
  }
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(landing());
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`RealCheck preview running at http://localhost:${PORT}`);
});

