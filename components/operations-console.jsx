"use client";

import { useEffect, useState } from "react";

const modules = [
  { key: "overview", label: "Overview" },
  { key: "documents", label: "Document intelligence" },
  { key: "products", label: "Product authenticity" },
  { key: "pos", label: "POS reliability" },
  { key: "investigations", label: "Investigations" }
];

function Severity({ value }) {
  const className = value === "Critical" || value === "High" ? "status-pill danger" : value === "Medium" ? "status-pill warning" : "status-pill info";
  return <span className={className}>{value}</span>;
}

function Metric({ label, value, delta, tone = "positive" }) {
  return (
    <article className="metric-card">
      <div className="flex items-start justify-between gap-3">
        <div className="metric-label">{label}</div>
        <span className={`metric-spark ${tone}`} aria-hidden="true">▂▅▃▆</span>
      </div>
      <div className="metric-value tabular-numbers">{value}</div>
      <span className={`delta-badge delta-${tone}`}>{delta}</span>
    </article>
  );
}

function Overview({ onModuleChange, dashboard }) {
  const metrics = dashboard?.metrics || {};
  const alerts = dashboard?.alerts || [];
  const investigations = dashboard?.investigations || [];
  const formatPercent = (value) => value == null ? "—" : `${(value * 100).toFixed(1)}%`;
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Open alerts" value={metrics.openAlerts ?? "—"} delta={dashboard?.synthetic ? "No records yet" : "Persisted records"} tone="negative" />
        <Metric label="Documents analyzed" value={metrics.documentsReviewed ?? "—"} delta="From local store" />
        <Metric label="Verified products" value={formatPercent(metrics.verifiedProducts)} delta={metrics.verifiedProducts == null ? "No verification events" : "From verification events"} />
        <Metric label="POS availability" value={formatPercent(metrics.posAvailability)} delta={metrics.posAvailability == null ? "No terminal events" : "From terminal events"} tone="negative" />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="surface-panel overflow-hidden">
          <div className="panel-heading">
            <div>
              <div className="section-label">Priority queue</div>
              <h2 className="panel-title">Alerts requiring attention</h2>
            </div>
            <button type="button" className="button-secondary button-small" onClick={() => onModuleChange("investigations")}>View queue</button>
          </div>
          <div className="data-list">
            {alerts.length ? alerts.map((alert) => (
              <div className="data-row" key={alert.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="code-label">{alert.id}</span>
                    <Severity value={String(alert.severity).replace(/^./, (value) => value.toUpperCase())} />
                  </div>
                  <div className="mt-2 truncate text-sm font-medium text-[var(--text-secondary)]">{alert.title}</div>
                  <div className="mt-1 truncate text-xs text-[var(--text-muted)]">{alert.subject}</div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-xs text-[var(--text-muted)]">{alert.source}</div>
                  <div className="mt-2 text-xs text-[var(--text-dim)]">{alert.age}</div>
                </div>
                <span className="status-pill info">{String(alert.status).replaceAll("_", " ")}</span>
              </div>
            )) : <div className="empty-state">No open alerts. Ingest a document, transaction, product scan, or terminal event to create evidence-backed alerts.</div>}
          </div>
        </div>

        <div className="surface-panel p-4">
          <div className="section-label">Risk weighting (heuristic)</div>
          <h2 className="panel-title">Reference model weighting</h2>
          <div className="mt-6 space-y-5">
            {[
              ["Document intelligence", "46%", "var(--primary)"],
              ["Transaction monitoring", "31%", "var(--risk)"],
              ["Product authenticity", "15%", "var(--warning)"],
              ["POS operations", "8%", "var(--success)"]
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">{label}</span>
                  <span className="tabular-numbers text-[var(--text-muted)]">{value}</span>
                </div>
                <div className="progress-track"><div className="progress-bar" style={{ width: value, background: color }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-7 border-t border-[var(--border-soft)] pt-4 text-xs leading-5 text-[var(--text-muted)]">
            Risk is aggregated from verified evidence, operational telemetry, and analyst decisions. No single signal establishes fraud.
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <button type="button" className="module-card text-left" onClick={() => onModuleChange("documents")}>
          <span className="module-icon violet">DOC</span>
          <span className="section-label">Evidence workflow</span>
          <strong>Review documents</strong>
          <span>Inspect extracted fields, file integrity, and evidence limitations.</span>
        </button>
        <button type="button" className="module-card text-left" onClick={() => onModuleChange("products")}>
          <span className="module-icon amber">SKU</span>
          <span className="section-label">Authenticity network</span>
          <strong>Verify a product</strong>
          <span>Check signed identifiers, scan history, and duplicate activity.</span>
        </button>
        <button type="button" className="module-card text-left" onClick={() => onModuleChange("pos")}>
          <span className="module-icon green">POS</span>
          <span className="section-label">Operations telemetry</span>
          <strong>Monitor terminals</strong>
          <span>Find availability drops and repeated payment failures before escalation.</span>
        </button>
      </section>
    </>
  );
}

function ModuleView({ module }) {
  const [query, setQuery] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [approved, setApproved] = useState(false);
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");
  const titles = {
    documents: ["Document intelligence", "Evidence-led review queue for submitted files"],
    products: ["Product authenticity", "Registered identifiers and suspicious verification activity"],
    pos: ["POS reliability", "Terminal health, payment failures, and operational anomalies"],
    investigations: ["Investigations", "Human-owned cases with auditable next actions"]
  };
  const [title, subtitle] = titles[module];

  useEffect(() => {
    let cancelled = false;
    async function loadRecords() {
      const endpoint = module === "documents" ? "/api/documents" : module === "products" ? "/api/products" : "/api/dashboard";
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load records.");
        if (!cancelled) setRecords(module === "documents" ? data.documents : module === "products" ? data.products : module === "pos" ? data.terminals : data.investigations);
      } catch (error) {
        if (!cancelled) setMessage(error.message);
      }
    }
    loadRecords();
    return () => { cancelled = true; };
  }, [module]);

  if (module === "documents") {
    return (
      <div className="space-y-5">
        <div className="module-hero">
          <div><div className="section-label">Document intelligence</div><h2 className="panel-title">{title}</h2><p>{subtitle}. Findings include confidence, evidence, and known limitations.</p></div>
          <label className="button-primary button-small cursor-pointer">{uploaded ? "File analyzed" : "Analyze document"}<input className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setMessage("Analyzing document..."); const form = new FormData(); form.append("file", file); const response = await fetch("/api/documents", { method: "POST", body: form }); const data = await response.json(); setMessage(response.ok ? `${file.name}: ${data.document.outcome.replaceAll("_", " ")}` : data.error); setUploaded(response.ok); if (response.ok) setRecords((current) => [data.document, ...current]); }} /></label>
        </div>
        {message && <div className="notice">{message}</div>}
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="surface-panel overflow-hidden"><div className="panel-heading"><div><div className="section-label">Review queue</div><h3 className="panel-title">Recent submissions</h3></div><span className="status-pill warning">{records.length} records</span></div>{records.length ? records.map((item, i) => <button type="button" key={item.id} className={`data-row w-full text-left ${selected === i ? "selected-row" : ""}`} onClick={() => setSelected(i)}><div><div className="code-label">{item.id}</div><div className="mt-2 text-sm text-[var(--text-secondary)]">{item.fileName}</div></div><Severity value={item.riskScore >= 60 ? "High" : "Low"} /><span className="text-xs text-[var(--text-dim)]">{item.status}</span></button>) : <div className="empty-state">No documents have been analyzed yet.</div>}</div>
          <div className="surface-panel p-4"><div className="section-label">Analysis pipeline</div><h3 className="panel-title">Checks enabled</h3><div className="mt-4 space-y-3">{["File signature and MIME", "Metadata and PDF structure", "OCR field consistency", "Duplicate submission search", "Cross-document comparison"].map((item) => <div className="check-row" key={item}><span className="check-dot" />{item}<span className="ml-auto code-label">READY</span></div>)}</div></div>
        </div>
      </div>
    );
  }

  const rows = module === "products"
    ? records.map((item) => [item.identifier, item.name, item.batch || "No batch", "Registered"])
    : module === "pos"
      ? records.map((item) => [item.id, item.location, item.health ? `${Math.round((1 - item.health.failureRate) * 100)}% availability` : "No events", item.health?.outcome || "No data"])
      : records.map((item) => [item.id, item.subject, item.type, `${item.risk || 0}% risk`]);

  return (
    <div className="surface-panel overflow-hidden">
      <div className="panel-heading"><div><div className="section-label">{module}</div><h2 className="panel-title">{title}</h2><p className="panel-subtitle">{subtitle}</p></div><button type="button" className="button-primary button-small" onClick={() => setApproved(true)}>{approved ? "Action recorded" : module === "investigations" ? "Create case" : "Export view"}</button></div>
      <div className="border-b border-[var(--border)] p-4"><input className="form-field max-w-sm" placeholder="Search records..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="data-table">
        <div className="data-table-head"><span>Identifier</span><span>Subject</span><span>Signal</span><span>State</span></div>
        {rows.filter((row) => row.join(" ").toLowerCase().includes(query.toLowerCase())).map((row) => <div className="data-table-row" key={row[0]}><span className="code-label">{row[0]}</span><span className="text-sm text-[var(--text-secondary)]">{row[1]}</span><span className="text-xs text-[var(--text-muted)]">{row[2]}</span><span><Severity value={row[3].includes("Healthy") || row[3].includes("Verified") ? "Low" : row[3].includes("risk") && Number.parseInt(row[3]) > 70 ? "High" : "Medium"} /></span></div>)}
      </div>
    </div>
  );
}

export default function OperationsConsole() {
  const [activeModule, setActiveModule] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState("");
  const isOverview = activeModule === "overview";

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load dashboard.");
        setDashboard(data);
      })
      .catch((error) => setDashboardError(error.message));
  }, []);

  return (
    <main className="console-shell">
      <aside className="console-rail">
        <div className="brand-lockup"><span className="brand-mark">R</span><span>RealCheck<span className="brand-muted"> / Sentinel</span></span></div>
        <div className="rail-label">Operational pillars</div>
        <div className="pillar-switcher"><button type="button" className="active">Fraud intelligence</button><button type="button">POS reliability</button></div>
        <nav className="rail-nav" aria-label="Primary navigation">{modules.map((item) => <button type="button" key={item.key} className={activeModule === item.key ? "active" : ""} onClick={() => setActiveModule(item.key)}><span className="nav-indicator" />{item.label}</button>)}</nav>
        <div className="rail-footer"><div className="status-line"><span className="live-dot" />All systems operational</div><div className="code-label">TENANT / NORTHSTAR-FIN</div></div>
      </aside>
      <div className="console-main">
        <header className="console-header"><div><div className="breadcrumb">Workspace <span>/</span> {isOverview ? "Overview" : modules.find((item) => item.key === activeModule)?.label}</div><h1>{isOverview ? "Good afternoon, Aaliyah" : modules.find((item) => item.key === activeModule)?.label}</h1></div><div className="header-actions"><span className="status-pill success">LIVE MONITORING</span><button type="button" className="avatar">AA</button></div></header>
        <div className="console-content">{dashboardError && <div className="notice error-notice">{dashboardError}</div>}{isOverview ? <Overview onModuleChange={setActiveModule} dashboard={dashboard} /> : <ModuleView module={activeModule} />}</div>
      </div>
    </main>
  );
}
