import { useState } from "react";

const DEFAULT_METRICS = {
  csat: "82", nps: "34", aht: "18", fcrRate: "71",
  slaBreach: "12", backlog: "247", escalationRate: "8",
  agentUtilization: "87", period: "Q1 FY2026",
  teamSize: "24", region: "India (Pune)",
};

const METRIC_CONFIG = [
  { key: "csat", label: "CSAT Score", unit: "%", good: v => v >= 85, warn: v => v >= 75 },
  { key: "nps", label: "NPS", unit: "", good: v => v >= 40, warn: v => v >= 20 },
  { key: "aht", label: "Avg Handle Time", unit: "min", good: v => v <= 15, warn: v => v <= 20 },
  { key: "fcrRate", label: "FCR Rate", unit: "%", good: v => v >= 80, warn: v => v >= 65 },
  { key: "slaBreach", label: "SLA Breach", unit: "%", good: v => v <= 5, warn: v => v <= 15 },
  { key: "backlog", label: "Open Backlog", unit: "", good: v => v <= 150, warn: v => v <= 300 },
  { key: "escalationRate", label: "Escalation Rate", unit: "%", good: v => v <= 5, warn: v => v <= 10 },
  { key: "agentUtilization", label: "Agent Utilization", unit: "%", good: v => v >= 80 && v <= 90, warn: v => v >= 70 },
];

function getStatus(config, value) {
  const v = parseFloat(value);
  if (config.good(v)) return "good";
  if (config.warn(v)) return "warn";
  return "critical";
}

const STATUS_STYLES = {
  good: { dot: "#00e5a0", label: "On Track" },
  warn: { dot: "#f5a623", label: "Watch" },
  critical: { dot: "#ff4d6d", label: "Critical" },
};

export default function App() {
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [narrative, setNarrative] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState("input");

  const handleChange = (key, value) => setMetrics(prev => ({ ...prev, [key]: value }));

  const overallHealth = (() => {
    const statuses = METRIC_CONFIG.map(m => getStatus(m, metrics[m.key]));
    const critCount = statuses.filter(s => s === "critical").length;
    const warnCount = statuses.filter(s => s === "warn").length;
    if (critCount >= 3) return { label: "AT RISK", color: "#ff4d6d", bg: "rgba(255,77,109,0.1)" };
    if (critCount >= 1 || warnCount >= 3) return { label: "NEEDS ATTENTION", color: "#f5a623", bg: "rgba(245,166,35,0.1)" };
    return { label: "HEALTHY", color: "#00e5a0", bg: "rgba(0,229,160,0.1)" };
  })();

  const generateNarrative = async () => {
    setLoading(true);
    setNarrative("");
    try {
      const prompt = `You are a senior Customer Experience leader preparing an executive briefing for a VP or C-suite audience.\n\nBased on the following support operations metrics for ${metrics.region}, ${metrics.period} (Team size: ${metrics.teamSize} agents), generate a concise, data-driven executive narrative (3-4 paragraphs).\n\nMetrics:\n- CSAT Score: ${metrics.csat}%\n- NPS: ${metrics.nps}\n- Average Handle Time: ${metrics.aht} minutes\n- First Contact Resolution (FCR): ${metrics.fcrRate}%\n- SLA Breach Rate: ${metrics.slaBreach}%\n- Open Backlog: ${metrics.backlog} tickets\n- Escalation Rate: ${metrics.escalationRate}%\n- Agent Utilization: ${metrics.agentUtilization}%\n\nYour narrative should:\n1. Open with a one-sentence overall health assessment\n2. Highlight 2-3 standout wins or strengths with specific numbers\n3. Call out 2 areas of concern with context and likely root causes\n4. Close with 2-3 recommended actions for the next 30-60 days\n\nTone: confident, direct, executive-ready. No bullet points - flowing prose only.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      setNarrative(data.content?.map(b => b.text || "").join("") || "No response generated.");
      setGenerated(true);
      setActiveTab("output");
    } catch { setNarrative("Error generating narrative. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", fontFamily: "monospace", color: "#c8d6e5" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { background: #0d1520; border: 1px solid #1a2d45; color: #c8d6e5; border-radius: 4px; padding: 8px 10px; font-family: inherit; font-size: 13px; width: 100%; outline: none; }
        input:focus { border-color: #2d6af6; }
        .metric-card { background: #0d1a2a; border: 1px solid #1a2d45; border-radius: 8px; padding: 16px; }
        .tab { background: none; border: none; color: #5a7a9a; font-family: inherit; font-size: 12px; letter-spacing: 0.12em; padding: 10px 20px; cursor: pointer; text-transform: uppercase; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab.active { color: #2d6af6; border-bottom-color: #2d6af6; }
        .generate-btn { background: linear-gradient(135deg, #1a4fd6, #2d6af6); border: none; color: white; font-family: inherit; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; padding: 14px 32px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .copy-btn { background: #1a2d45; border: 1px solid #2d4a70; color: #8aacc8; font-family: inherit; font-size: 11px; padding: 6px 14px; border-radius: 4px; cursor: pointer; }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        .fade-in { animation: fadeIn 0.6s ease-out; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ borderBottom: "1px solid #1a2d45", padding: "20px 36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 800, color: "#e8f0fa" }}>SUPPORT OPS NARRATOR</div>
          <div style={{ fontSize: "11px", color: "#3a5a7a", letterSpacing: "0.15em", marginTop: "2px" }}>AI-POWERED EXECUTIVE BRIEFING GENERATOR</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "11px", color: "#3a5a7a" }}>OVERALL HEALTH</div>
          <div style={{ background: overallHealth.bg, border: `1px solid ${overallHealth.color}40`, borderRadius: "4px", padding: "6px 14px" }}>
            <span style={{ color: overallHealth.color, fontSize: "12px", fontWeight: 600 }}>{overallHealth.label}</span>
          </div>
        </div>
      </div>

      <div style={{ background: "#0a1020", borderBottom: "1px solid #1a2d45", padding: "12px 36px", display: "flex", gap: "32px" }}>
        {[{ label: "PERIOD", key: "period", width: 110 }, { label: "REGION", key: "region", width: 130 }, { label: "TEAM SIZE", key: "teamSize", width: 60 }].map(({ label, key, width }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "10px", color: "#3a5a7a", letterSpacing: "0.15em" }}>{label}</span>
            <input value={metrics[key]} onChange={e => handleChange(key, e.target.value)} style={{ width }} />
          </div>
        ))}
      </div>

      <div style={{ borderBottom: "1px solid #1a2d45", padding: "0 36px", display: "flex" }}>
        <button className={`tab ${activeTab === "input" ? "active" : ""}`} onClick={() => setActiveTab("input")}>Metric Input</button>
        <button className={`tab ${activeTab === "output" ? "active" : ""}`} onClick={() => setActiveTab("output")}>Executive Narrative {generated && "●"}</button>
      </div>

      <div style={{ padding: "32px 36px", maxWidth: "1100px" }}>
        {activeTab === "input" && (
          <div className="fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
              {METRIC_CONFIG.map(config => {
                const status = getStatus(config, metrics[config.key]);
                const s = STATUS_STYLES[status];
                return (
                  <div key={config.key} className="metric-card" style={{ borderColor: status !== "good" ? `${s.dot}40` : "#1a2d45" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ fontSize: "10px", color: "#4a7090", letterSpacing: "0.12em", textTransform: "uppercase" }}>{config.label}</span>
                      <span style={{ fontSize: "9px", color: s.dot, background: `${s.dot}15`, padding: "2px 7px", borderRadius: "3px" }}>{s.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "28px", fontWeight: 600, color: s.dot, fontFamily: "'Syne', sans-serif" }}>{metrics[config.key] || "—"}</span>
                      <span style={{ fontSize: "13px", color: "#4a7090" }}>{config.unit}</span>
                    </div>
                    <input type="number" value={metrics[config.key]} onChange={e => handleChange(config.key, e.target.value)} />
                  </div>
                );
              })}
            </div>
            <button className="generate-btn" onClick={generateNarrative} disabled={loading}>
              {loading ? <span className="pulse">GENERATING...</span> : "GENERATE EXECUTIVE NARRATIVE →"}
            </button>
          </div>
        )}

        {activeTab === "output" && (
          <div className="fade-in">
            {!narrative && !loading && <div style={{ textAlign: "center", padding: "60px 0", color: "#3a5a7a", fontSize: "13px" }}>No narrative generated yet. Go to Metric Input and click Generate.</div>}
            {loading && <div style={{ textAlign: "center", padding: "60px 0", fontSize: "11px", color: "#2d6af6", letterSpacing: "0.2em" }} className="pulse">ANALYZING METRICS · GENERATING NARRATIVE</div>}
            {narrative && !loading && (
              <div>
                <div style={{ background: "#0a1520", border: "1px solid #1a3050", borderRadius: "10px", padding: "32px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "9px", color: "#2d5080", letterSpacing: "0.2em", marginBottom: "16px" }}>EXECUTIVE BRIEFING · {metrics.region} · {metrics.period}</div>
                  <div style={{ lineHeight: "1.85", fontSize: "14px", color: "#b8cfe0" }}>
                    {narrative.split("\n\n").map((p, i) => <p key={i} style={{ marginBottom: 18 }}>{p}</p>)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button className="copy-btn" onClick={() => navigator.clipboard.writeText(narrative)}>COPY NARRATIVE</button>
                  <button className="generate-btn" style={{ fontSize: "11px", padding: "8px 20px" }} onClick={generateNarrative} disabled={loading}>REGENERATE</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
