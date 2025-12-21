// PrintReportV2.jsx
import React, { forwardRef, useMemo } from "react";

/**
 * PrintReportV2
 * - Keeps PrintReport (v1) color theme
 * - Uses PrintReportV2 (your provided V2) CONTENT STRUCTURE
 * - Dependency-free, safe helpers included
 *
 * Props:
 *  - reportMeta (from iship_report_meta_v1)
 *  - analysis   (prepared in SummaryV2)
 *  - modelName  (string)
 */

const IMAGE_HEIGHT = 240;
const PHOTOS_PER_BLOCK = 4; // 2x2 grid

function safeString(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function toTextList(v) {
  if (v === null || v === undefined) return [];
  if (Array.isArray(v)) return v.map((x) => safeString(x)).map((s) => s.trim()).filter(Boolean);

  const s = safeString(v).trim();
  if (!s) return [];
  if (s.includes("\n")) return s.split("\n").map((x) => x.trim()).filter(Boolean);
  return s.split(";").map((x) => x.trim()).filter(Boolean);
}

function normalizeCondition(raw) {
  const s = safeString(raw).trim().toLowerCase();
  if (!s) return "none";
  if (["none", "na", "n/a", "ok", "satisfactory", "good"].includes(s)) return "none";
  if (["rust", "corrosion", "rusting"].includes(s)) return "rust";
  if (["attention", "issue", "problem", "concern", "nonconformity", "non-conformity"].includes(s)) return "attention";
  if (["defect", "defective"].includes(s)) return "defect";
  // support your original conditions too
  if (["fire_hazard", "trip_fall"].includes(s)) return s;
  return s;
}

function normalizeSeverity(raw) {
  const s = safeString(raw).trim().toLowerCase();
  if (!s) return "";
  if (["low", "minor"].includes(s)) return "low";
  if (["medium", "moderate"].includes(s)) return "medium";
  if (["high", "major"].includes(s)) return "high";
  if (["extreme", "critical"].includes(s)) return "critical";
  return s;
}

function normalizePriority(raw) {
  const s = safeString(raw).trim().toLowerCase();
  if (!s) return "";
  if (["low"].includes(s)) return "low";
  if (["medium", "normal"].includes(s)) return "medium";
  if (["high", "urgent"].includes(s)) return "high";
  if (["critical", "immediate", "immediate action required"].includes(s)) return "critical";
  return s;
}

function chunk(arr, size) {
  const out = [];
  const a = Array.isArray(arr) ? arr : [];
  for (let i = 0; i < a.length; i += size) out.push(a.slice(i, i + size));
  return out;
}

function defaultAbbreviations() {
  return [
    "IMO = International Maritime Organization",
    "ISM = International Safety Management",
    "PSC = Port State Control",
    "PPE = Personal Protective Equipment",
    "NCR = Non-Conformity Report",
    "SMS = Safety Management System",
    "ETA = Estimated Time of Arrival",
    "ETD = Estimated Time of Departure",
    "LOA = Length Overall",
    "GT = Gross Tonnage",
    "DWT = Deadweight Tonnage",
    "SOP = Standard Operating Procedure",
  ];
}

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr || []) {
    const k = safeString(x).trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function computeOverallRating({ avgScore, defectsVisible }) {
  let scoreNum = Number(avgScore);
  const hasAvg = !Number.isNaN(scoreNum) && Number.isFinite(scoreNum);

  // if 0-5-ish scale, map to 0-100
  if (hasAvg && scoreNum > 0 && scoreNum <= 5.5) scoreNum = scoreNum * 20;

  const defects = Array.isArray(defectsVisible) ? defectsVisible : [];
  const crit = defects.filter(
    (d) => normalizeSeverity(d.severity) === "critical" || normalizePriority(d.priority) === "critical"
  ).length;
  const high = defects.filter((d) => normalizeSeverity(d.severity) === "high").length;

  let derivedScore = hasAvg ? scoreNum : 80;
  derivedScore -= crit * 8;
  derivedScore -= high * 3;

  if (derivedScore < 0) derivedScore = 0;
  if (derivedScore > 100) derivedScore = 100;

  let label = "Good";
  if (derivedScore >= 85) label = "Excellent";
  else if (derivedScore >= 70) label = "Good";
  else if (derivedScore >= 55) label = "Fair";
  else label = "Poor";

  return { score: Math.round(derivedScore), label, crit, high };
}

function summarizeCommercialImpact(defectsVisible) {
  const defects = Array.isArray(defectsVisible) ? defectsVisible : [];
  const crit = defects.filter(
    (d) => normalizeSeverity(d.severity) === "critical" || normalizePriority(d.priority) === "critical"
  );
  const high = defects.filter((d) => normalizeSeverity(d.severity) === "high");

  const impacts = [];
  if (crit.length) impacts.push("High risk of operational disruption / off-hire / detention for critical items.");
  if (high.length) impacts.push("Elevated maintenance and compliance exposure for high-severity items.");
  if (!crit.length && !high.length)
    impacts.push("No critical/high items flagged; impacts are primarily routine maintenance and housekeeping.");

  return { crit, high, impacts };
}

function groupPhotosByLocation(perImageNormalized) {
  const items = Array.isArray(perImageNormalized) ? perImageNormalized : [];
  const groups = new Map();
  for (const it of items) {
    const loc = safeString(it.__location || it.location || it.area).trim() || "Unspecified area";
    if (!groups.has(loc)) groups.set(loc, []);
    groups.get(loc).push(it);
  }
  return Array.from(groups.entries()).map(([location, list]) => ({ location, items: list }));
}

function effectiveConditionForPrint(it) {
  const stored = normalizeCondition(it?.__condition || it?.condition || it?.condition_type);
  const sev = normalizeSeverity(it?.__severity || it?.severity);
  const pri = normalizePriority(it?.__priority || it?.priority);
  const recs = it?.__recommendations || toTextList(it?.recommendations_high_severity_only || it?.recommendations);

  if (stored === "none") {
    if (recs.length) return "attention";
    if (["high", "critical"].includes(sev)) return "attention";
    if (pri === "critical") return "attention";
  }
  return stored || "none";
}

function conditionLabel(cond) {
  const c = normalizeCondition(cond);
  const map = {
    fire_hazard: "Fire hazard",
    trip_fall: "Trip / fall",
    none: "Satisfactory",
    rust: "Rust",
    attention: "Attention",
    defect: "Defect",
  };
  return map[c] || c.toUpperCase();
}

function kpiFromDefects(defectsVisible) {
  const list = Array.isArray(defectsVisible) ? defectsVisible : [];
  const total = list.length;
  const critical = list.filter(
    (d) => normalizeSeverity(d.severity) === "critical" || normalizePriority(d.priority) === "critical"
  ).length;
  const high = list.filter((d) => normalizeSeverity(d.severity) === "high").length;
  return { total, critical, high };
}

const PrintReportV2 = forwardRef(function PrintReportV2({ reportMeta, analysis, modelName }, ref) {
  const meta = reportMeta || {};
  const a = analysis || {};

  const vessel = meta.vessel || {};
  const inspector = meta.inspector || {};
  const movement = meta.vesselMovement || {};
  const crew = meta.crew || {};

  const perImageNormalized = Array.isArray(a.perImageNormalized) ? a.perImageNormalized : [];
  const defectsVisible = Array.isArray(a.defectsVisible) ? a.defectsVisible : [];

  const abbreviations = useMemo(() => {
    const merged = uniq([...(defaultAbbreviations() || []), ...(meta.abbreviationsCustom || [])]);
    return merged.sort((x, y) => safeString(x).localeCompare(safeString(y)));
  }, [meta.abbreviationsCustom]);

  const rating = useMemo(() => {
    if (meta?.ratingOverride?.useOverride) {
      const score = Number(meta?.ratingOverride?.score);
      const label = safeString(meta?.ratingOverride?.label) || "Override";
      return {
        score: Number.isFinite(score) ? score : "",
        label,
        crit: 0,
        high: 0,
        overrideRationale: safeString(meta?.ratingOverride?.rationale),
        isOverride: true,
      };
    }
    return { ...computeOverallRating({ avgScore: a.avgScore, defectsVisible }), isOverride: false };
  }, [a.avgScore, defectsVisible, meta?.ratingOverride]);

  const commercial = useMemo(() => summarizeCommercialImpact(defectsVisible), [defectsVisible]);

  const photoGroups = useMemo(() => groupPhotosByLocation(perImageNormalized), [perImageNormalized]);

  const executiveSummaryText = useMemo(() => {
    if (meta?.executiveSummary?.useManual && safeString(meta?.executiveSummary?.text).trim()) {
      return safeString(meta.executiveSummary.text);
    }

    const topCritical = commercial.crit.slice(0, 5).map((d) => {
      const loc = safeString(d.location || d.area).trim();
      const rec = (d.recommendations || []).slice(0, 2).join("; ");
      return `• ${conditionLabel(d.condition)}${loc ? ` @ ${loc}` : ""}: ${
        safeString(d.comment).trim() || "Issue flagged"
      }${rec ? ` (Action: ${rec})` : ""}`;
    });

    const headline = [
      `Inspection summary generated from model: ${safeString(modelName || "N/A")}.`,
      `Overall vessel rating: ${safeString(rating.label)}${rating.score !== "" ? ` (${rating.score}/100)` : ""}.`,
      commercial.crit.length ? `Critical items identified: ${commercial.crit.length}.` : "No critical items identified.",
      commercial.high.length ? `High-severity items identified: ${commercial.high.length}.` : "No high-severity items identified.",
    ];

    return [...headline, "", "Key Highlights:", ...(topCritical.length ? topCritical : ["• No critical highlights available."])].join("\n");
  }, [meta?.executiveSummary, modelName, rating, commercial]);

  const defectsKpi = useMemo(() => kpiFromDefects(defectsVisible), [defectsVisible]);

  return (
    <div ref={ref} className="print-root" style={{ background: "white", color: "#111827" }}>
      <style>{`
        @page { size: A4; margin: 18mm 14mm; }
        @media print {
          html, body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-page { break-after: page; page-break-after: always; }
          .print-page:last-child { break-after: auto; page-break-after: auto; }
          .no-break { break-inside: avoid; page-break-inside: avoid; }
          h1, h2, h3, p, table, tr, td, th, img { break-inside: avoid; page-break-inside: avoid; }
          table { break-inside: auto; page-break-inside: auto; }
          tr { break-inside: avoid; page-break-inside: avoid; }
          .wrap { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
          img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }

        .page-pad { padding: 18px 18px; }
        .muted { color: #4B5563; font-size: 12px; }
        .rule { margin: 14px 0; border: none; border-top: 1px solid #E5E7EB; }

        /* V1 THEME (blue) */
        .hdr {
          border: 1px solid #DBEAFE;
          background: #EFF6FF;
          border-radius: 14px;
          padding: 14px 14px;
        }
        .hdrTitle { font-size: 22px; font-weight: 900; color: #0F172A; margin: 0; }
        .hdrSub { margin-top: 6px; font-size: 12px; color: #475569; }
        .hdrMeta { font-size: 12px; color: #334155; text-align: right; }

        .secTitle { font-size: 16px; font-weight: 900; color: #0F172A; margin: 0; }
        .secNote { font-size: 12px; color: #475569; margin-top: 6px; }

        .card {
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          background: #FFFFFF;
          padding: 12px;
        }

        .twoCol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; font-size: 12px; }
        .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }

        .kpiGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .kpiBox {
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 12px;
          background: #FFFFFF;
        }
        .kpiLabel { font-size: 11px; color: #64748B; }
        .kpiValue { font-size: 20px; font-weight: 900; color: #0F172A; margin-top: 2px; }
        .kpiFire { border-left: 6px solid #EF4444; }
        .kpiTrip { border-left: 6px solid #F59E0B; }
        .kpiOk { border-left: 6px solid #10B981; }
        .kpiBlue { border-left: 6px solid #2563EB; }
        .kpiViolet { border-left: 6px solid #7C3AED; }

        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th {
          text-align: left;
          border-bottom: 1px solid #E5E7EB;
          padding: 8px;
          background: #F8FAFC;
          color: #334155;
          font-weight: 800;
        }
        td { border-bottom: 1px solid #F1F5F9; padding: 8px; vertical-align: top; color: #111827; }

        .badge {
          display:inline-flex;
          align-items:center;
          gap:6px;
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #0f172a;
          font-weight: 700;
        }
        .badge.none { background:#ecfeff; border-color:#a5f3fc; }
        .badge.attention { background:#fffbeb; border-color:#fcd34d; }
        .badge.rust { background:#fff7ed; border-color:#fdba74; }
        .badge.defect { background:#fef2f2; border-color:#fca5a5; }
        .badge.fire_hazard { background:#fef2f2; border-color:#fecaca; }
        .badge.trip_fall { background:#fffbeb; border-color:#fde68a; }

        .imgGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .imgCard { border: 1px solid #E5E7EB; border-radius: 12px; padding: 10px; background: #FFFFFF; }
        .img {
          width: 100%;
          height: ${IMAGE_HEIGHT}px;
          object-fit: contain;
          background: #F8FAFC;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
          display: block;
        }

        .mini { font-size: 11px; color:#374151; }
        .list { margin: 0; padding-left: 18px; }
      `}</style>

      {/* PAGE 1: Header + quick KPIs */}
      <div className="print-page page-pad">
        <div className="hdr no-break" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 className="hdrTitle">Vessel Inspection Report</h1>
            <div className="hdrSub">
              Generated by iShip Inspection AI • Model: <b>{safeString(modelName || "—")}</b>
            </div>
          </div>
          <div className="hdrMeta">
            <div>
              <b>Inspection Date:</b> {safeString(inspector.inspectionDate || "—")}
            </div>
            <div>
              <b>Location:</b> {safeString(inspector.inspectionLocation || "—")}
            </div>
            <div>
              <b>Inspector:</b> {safeString(inspector.name || "—")}
            </div>
          </div>
        </div>

        <hr className="rule" />

        <div className="twoCol no-break">
          <div>
            <b>Vessel Name:</b> {safeString(vessel.name || "—")}
          </div>
          <div>
            <b>IMO:</b> {safeString(vessel.imo || "—")}
          </div>
          <div>
            <b>Flag:</b> {safeString(vessel.flag || "—")}
          </div>
          <div>
            <b>Call Sign:</b> {safeString(vessel.callSign || vessel.call_sign || "—")}
          </div>
        </div>

        <hr className="rule" />

        <div className="kpiGrid no-break">
          <div className="kpiBox kpiBlue">
            <div className="kpiLabel">Overall Rating</div>
            <div className="kpiValue">{safeString(rating.label || "—")}</div>
            <div className="muted">{rating.score !== "" ? `${rating.score}/100` : "—"}</div>
          </div>
          <div className="kpiBox kpiViolet">
            <div className="kpiLabel">Defects</div>
            <div className="kpiValue">{defectsKpi.total}</div>
            <div className="muted">
              Critical: <b>{defectsKpi.critical}</b> • High: <b>{defectsKpi.high}</b>
            </div>
          </div>
          <div className="kpiBox kpiOk">
            <div className="kpiLabel">Photos Analyzed</div>
            <div className="kpiValue">{perImageNormalized.length}</div>
            <div className="muted">Grouped by location in gallery</div>
          </div>
        </div>

        <hr className="rule" />

        <div className="card no-break">
          <p className="secTitle">Index</p>
          <ol className="mini wrap list" style={{ marginTop: 10 }}>
            <li>Disclaimer</li>
            <li>Distribution List</li>
            <li>Terms and Abbreviations</li>
            <li>References</li>
            <li>Vessel Particulars</li>
            <li>Inspector&apos;s Particulars</li>
            <li>Vessel Movement</li>
            <li>Crew Particulars</li>
            <li>Executive Summary</li>
            <li>Overall Rating of the Vessel</li>
            <li>Summary of Findings and Commercial Impact</li>
            <li>Photo Gallery</li>
          </ol>
          <p className="muted" style={{ marginTop: 10 }}>
            Note: Printed page numbers may vary based on printer/PDF settings.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="print-page page-pad">
        <div className="card no-break">
          <p className="secTitle">Disclaimer</p>
          <div className="wrap mini" style={{ marginTop: 10 }}>
            {safeString(meta.disclaimer || "—")}
          </div>
        </div>

        <hr className="rule" />

        <div className="card no-break">
          <p className="secTitle">Distribution List</p>
          <div style={{ marginTop: 10 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>Role</th>
                  <th style={{ width: "35%" }}>Name</th>
                  <th style={{ width: "45%" }}>Email</th>
                </tr>
              </thead>
              <tbody>
                {(meta.distribution || []).map((r, idx) => (
                  <tr key={idx}>
                    <td>{safeString(r.role)}</td>
                    <td>{safeString(r.name)}</td>
                    <td>{safeString(r.email)}</td>
                  </tr>
                ))}
                {(!meta.distribution || meta.distribution.length === 0) && (
                  <tr>
                    <td colSpan={3} className="muted">
                      No distribution entries provided.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <hr className="rule" />

        <div className="card no-break">
          <p className="secTitle">Terms and Abbreviations</p>
          <div className="wrap mini" style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 900, color: "#0F172A", marginBottom: 6 }}>Abbreviations</div>
            <ul className="list">
              {abbreviations.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>

            <hr className="rule" />

            <div style={{ fontWeight: 900, color: "#0F172A", marginBottom: 6 }}>Terms</div>
            <ul className="list">
              <li>
                <b>Observation:</b> A recorded condition noted during inspection (may or may not require action).
              </li>
              <li>
                <b>Defect / Non-conformity:</b> A condition requiring attention or corrective action as per best practice / SOP.
              </li>
              <li>
                <b>Severity:</b> Indicative impact level (low/medium/high/critical).
              </li>
              <li>
                <b>Priority:</b> Urgency for action (low/medium/high/critical).
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* References + Particulars */}
      <div className="print-page page-pad">
        <div className="card no-break">
          <p className="secTitle">References</p>
          <div className="wrap mini" style={{ marginTop: 10 }}>
            {Array.isArray(meta.references) && meta.references.length ? (
              <ul className="list">
                {meta.references.map((r, i) => (
                  <li key={i}>{safeString(r)}</li>
                ))}
              </ul>
            ) : (
              <div className="muted">No references provided.</div>
            )}
          </div>
        </div>

        <hr className="rule" />

        <div className="card no-break">
          <p className="secTitle">Vessel Particulars</p>
          <div style={{ marginTop: 10 }}>
            <table>
              <tbody>
                {[
                  ["Vessel Name", vessel.name],
                  ["IMO", vessel.imo],
                  ["Flag", vessel.flag],
                  ["Class", vessel.class],
                  ["Type", vessel.type],
                  ["DWT", vessel.dwt],
                  ["GT", vessel.gt],
                  ["LOA", vessel.loa],
                  ["Beam", vessel.beam],
                  ["Year Built", vessel.yearBuilt],
                  ["Port of Registry", vessel.portOfRegistry],
                  ["Call Sign", vessel.callSign],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <th style={{ width: "30%" }}>{k}</th>
                    <td className="wrap">{safeString(v || "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <hr className="rule" />

        <div className="card no-break">
          <p className="secTitle">Inspector&apos;s Particulars</p>
          <div style={{ marginTop: 10 }}>
            <table>
              <tbody>
                {[
                  ["Inspector Name", inspector.name],
                  ["Company", inspector.company],
                  ["Email", inspector.email],
                  ["Phone", inspector.phone],
                  ["Credentials", inspector.credentials],
                  ["Inspection Date", inspector.inspectionDate],
                  ["Inspection Location", inspector.inspectionLocation],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <th style={{ width: "30%" }}>{k}</th>
                    <td className="wrap">{safeString(v || "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Vessel movement + crew */}
      <div className="print-page page-pad">
        <div className="card no-break">
          <p className="secTitle">Vessel Movement</p>
          <div style={{ marginTop: 10 }}>
            <table>
              <tbody>
                {[
                  ["Last Port", movement.lastPort],
                  ["Current Port", movement.currentPort],
                  ["Next Port", movement.nextPort],
                  ["ETA", movement.eta],
                  ["ETD", movement.etd],
                  ["Berth / Anchorage", movement.berthOrAnchorage],
                  ["Voyage Notes", movement.voyageNotes],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <th style={{ width: "30%" }}>{k}</th>
                    <td className="wrap">{safeString(v || "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <hr className="rule" />

        <div className="card no-break">
          <p className="secTitle">Crew Particulars</p>
          <div style={{ marginTop: 10 }}>
            <table>
              <tbody>
                {[
                  ["Total Crew", crew.total],
                  ["Officers", crew.officers],
                  ["Ratings", crew.ratings],
                  ["Nationalities Summary", crew.nationalities],
                  ["Key Officers", crew.keyOfficers],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <th style={{ width: "30%" }}>{k}</th>
                    <td className="wrap">{safeString(v || "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <hr className="rule" />

        <div className="card no-break">
          <p className="secTitle">Executive Summary</p>
          <div className="wrap mini" style={{ marginTop: 10 }}>
            {executiveSummaryText || "—"}
          </div>
        </div>
      </div>

      {/* Overall rating + commercial impact */}
      <div className="print-page page-pad">
        <div className="card no-break">
          <p className="secTitle">Overall Rating of the Vessel</p>

          <div className="kpiGrid" style={{ marginTop: 10 }}>
            <div className="kpiBox kpiBlue">
              <div className="kpiLabel">Rating</div>
              <div className="kpiValue">{safeString(rating.label || "—")}</div>
            </div>

            <div className="kpiBox kpiOk">
              <div className="kpiLabel">Score</div>
              <div className="kpiValue">{rating.score !== "" ? `${rating.score}/100` : "—"}</div>
            </div>

            <div className="kpiBox kpiViolet">
              <div className="kpiLabel">Method</div>
              <div className="kpiValue">{rating.isOverride ? "Manual" : "Auto"}</div>
            </div>
          </div>

          {!rating.isOverride && (
            <div className="twoCol" style={{ marginTop: 10 }}>
              <div>
                <b>Critical items:</b> {rating.crit}
              </div>
              <div>
                <b>High-severity items:</b> {rating.high}
              </div>
            </div>
          )}

          {rating.isOverride && safeString(rating.overrideRationale).trim() ? (
            <>
              <hr className="rule" />
              <div style={{ fontWeight: 900, color: "#0F172A" }}>Override Rationale</div>
              <div className="wrap mini" style={{ marginTop: 6 }}>
                {rating.overrideRationale}
              </div>
            </>
          ) : null}
        </div>

        <hr className="rule" />

        <div className="card">
          <p className="secTitle">Summary of Findings and Commercial Impact</p>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 900, color: "#0F172A", marginBottom: 6 }}>Commercial Impact</div>
            <ul className="list mini">
              {commercial.impacts.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <hr className="rule" />

          <div style={{ fontWeight: 900, color: "#0F172A", marginBottom: 6 }}>Top Critical Findings</div>
          {commercial.crit.length ? (
            <table>
              <thead>
                <tr>
                  <th style={{ width: "18%" }}>Location</th>
                  <th style={{ width: "14%" }}>Condition</th>
                  <th style={{ width: "14%" }}>Severity/Priority</th>
                  <th>Notes</th>
                  <th style={{ width: "22%" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {commercial.crit.slice(0, 8).map((d) => (
                  <tr key={d.id}>
                    <td className="wrap">{safeString(d.location || d.area || "—")}</td>
                    <td>
                      <span className={`badge ${normalizeCondition(d.condition)}`}>
                        {normalizeCondition(d.condition).toUpperCase()}
                      </span>
                    </td>
                    <td className="wrap">
                      {normalizeSeverity(d.severity) || "—"} / {normalizePriority(d.priority) || "—"}
                    </td>
                    <td className="wrap">{safeString(d.comment || "—")}</td>
                    <td className="wrap">{(d.recommendations || []).slice(0, 3).join("\n") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="muted">No critical findings identified.</div>
          )}

          <hr className="rule" />
          <div className="mini muted">
            Total defects shown: <b>{defectsVisible.length}</b> • Critical: <b>{commercial.crit.length}</b> • High:{" "}
            <b>{commercial.high.length}</b>
          </div>
        </div>
      </div>

      {/* ✅ MOVED UP: Defects & Non-Conformities (Photos) — NOW ABOVE LOCATION-WISE GALLERY */}
      <div className="print-page page-pad">
        <div className="hdr no-break" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div className="hdrTitle" style={{ fontSize: 18 }}>
              Defects & Non-Conformities (Photos)
            </div>
            <div className="hdrSub">Derived + manual defects with actions & assignments (where available).</div>
          </div>
          <div className="hdrMeta">
            <div>
              <b>Total:</b> {defectsVisible.length}
            </div>
            <div>
              <b>Critical:</b> {commercial.crit.length}
            </div>
            <div>
              <b>High:</b> {commercial.high.length}
            </div>
          </div>
        </div>

        <hr className="rule" />

        {defectsVisible.length ? (
          <div className="imgGrid">
            {defectsVisible.map((d) => {
              const imageUrl = safeString(d.imageUrl);
              const recs = Array.isArray(d.recommendations) ? d.recommendations : toTextList(d.recommendations);

              return (
                <div key={d.id} className="imgCard no-break">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <span className={`badge ${normalizeCondition(d.condition)}`}>{conditionLabel(d.condition)}</span>
                    <span className="muted">{d.isDerived ? "Derived" : "Manual"}</span>
                  </div>

                  <div className="mini wrap" style={{ marginTop: 8 }}>
                    <b>Location:</b> {safeString(d.location || d.area || "—")}
                    {safeString(d.severity).trim() || safeString(d.priority).trim() ? (
                      <>
                        {" "}
                        • <b>Severity/Priority:</b> {normalizeSeverity(d.severity) || "—"} /{" "}
                        {normalizePriority(d.priority) || "—"}
                      </>
                    ) : null}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <img
                      className="img"
                      src={imageUrl}
                      alt={d.id}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      loading="eager"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  <div className="mini wrap" style={{ marginTop: 10 }}>
                    <b>Notes:</b> {safeString(d.comment || "—")}
                  </div>

                  {recs.length ? (
                    <div className="mini wrap" style={{ marginTop: 8 }}>
                      <b>Actions:</b>
                      {"\n"}
                      {recs.slice(0, 4).join("\n")}
                    </div>
                  ) : null}

                  {(safeString(d.assignedTo).trim() || safeString(d.deadline).trim()) ? (
                    <div className="mini wrap" style={{ marginTop: 8 }}>
                      <b>Assigned To:</b> {safeString(d.assignedTo || "—")} • <b>Deadline:</b>{" "}
                      {safeString(d.deadline || "—")}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="muted">No defects available.</div>
        )}
      </div>

      {/* Photo Gallery (Location-wise) */}
      {photoGroups.map((group) => {
        const blocks = chunk(group.items, PHOTOS_PER_BLOCK);

        return blocks.map((blockItems, bi) => (
          <div key={`${group.location}-${bi}`} className="print-page page-pad">
            <div className="hdr no-break" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div className="hdrTitle" style={{ fontSize: 18 }}>
                  Photo Gallery — Location-wise Findings
                </div>
                <div className="hdrSub">
                  <b>Area:</b> {group.location} {blocks.length > 1 ? `• Part ${bi + 1} of ${blocks.length}` : ""}
                </div>
              </div>
              <div className="hdrMeta">
                <div>
                  <b>Vessel:</b> {safeString(vessel.name || "—")}
                </div>
                <div>
                  <b>Date:</b> {safeString(inspector.inspectionDate || "—")}
                </div>
                <div>
                  <b>Port:</b> {safeString(inspector.inspectionLocation || "—")}
                </div>
              </div>
            </div>

            <hr className="rule" />

            <div className="imgGrid">
              {blockItems.map((it, idx) => {
                const cond = effectiveConditionForPrint(it);
                const sev = normalizeSeverity(it.__severity || it.severity);
                const pri = normalizePriority(it.__priority || it.priority);
                const comment = safeString(it.__comment || it.comment || it.comments);
                const recs =
                  it.__recommendations ||
                  toTextList(it.recommendations_high_severity_only || it.recommendations);
                const imageUrl = safeString(it.__imageUrl || it.image_url || it.url);
                const sourceIndex =
                  Number.isFinite(Number(it.__sourceIndex)) ? Number(it.__sourceIndex) : bi * PHOTOS_PER_BLOCK + idx;

                return (
                  <div key={`${safeString(it.id || it.__sourceIndex || sourceIndex)}`} className="imgCard no-break">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <span className={`badge ${normalizeCondition(cond)}`}>{conditionLabel(cond)}</span>
                      <span className="muted">
                        #{sourceIndex + 1}
                        {sev ? ` • ${sev}` : ""}
                        {pri ? ` • ${pri}` : ""}
                      </span>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <img
                        className="img"
                        src={imageUrl}
                        alt={`photo-${sourceIndex}`}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        loading="eager"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <div style={{ marginTop: 10 }} className="mini wrap">
                      <b>Impact / Notes:</b> {comment || "—"}
                    </div>

                    {(recs || []).length > 0 ? (
                      <div style={{ marginTop: 8 }} className="mini wrap">
                        <b>Recommendations:</b> {recs.join("\n")}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ));
      })}

      {/* Appendix: All Photos */}
      {chunk(perImageNormalized, PHOTOS_PER_BLOCK).map((blockItems, bi) => (
        <div key={`appendix-${bi}`} className="print-page page-pad">
          <div className="hdr no-break" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div className="hdrTitle" style={{ fontSize: 18 }}>
                Appendix: All Photos
              </div>
              <div className="hdrSub">Flat list in inspection order.</div>
            </div>
            <div className="hdrMeta">
              <div>
                <b>Block:</b> {bi + 1} / {Math.max(1, Math.ceil(perImageNormalized.length / PHOTOS_PER_BLOCK))}
              </div>
              <div>
                <b>Total Photos:</b> {perImageNormalized.length}
              </div>
            </div>
          </div>

          <hr className="rule" />

          <div className="imgGrid">
            {blockItems.map((it) => {
              const imageUrl = safeString(it.__imageUrl || it.image_url || it.url);
              const loc = safeString(it.__location || it.location || it.area).trim() || "Unspecified area";
              const cond = effectiveConditionForPrint(it);
              const comment = safeString(it.__comment || it.comment || it.comments);
              const sourceIndex = Number.isFinite(Number(it.__sourceIndex)) ? Number(it.__sourceIndex) : 0;

              return (
                <div
                  key={`appendix-item-${safeString(it.id || it.__sourceIndex || `${bi}-${sourceIndex}`)}`}
                  className="imgCard no-break"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <span className={`badge ${normalizeCondition(cond)}`}>{conditionLabel(cond)}</span>
                    <span className="muted">#{sourceIndex + 1}</span>
                  </div>

                  <div className="mini wrap" style={{ marginTop: 8 }}>
                    <b>Location:</b> {loc}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <img
                      className="img"
                      src={imageUrl}
                      alt={`appendix-${sourceIndex}`}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      loading="eager"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  <div className="mini wrap" style={{ marginTop: 10 }}>
                    {comment || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="page-pad" style={{ textAlign: "center" }}>
        <div className="muted">
          Generated by iShip • {safeString(vessel.name || "Vessel")} • Model: {safeString(modelName || "—")}
        </div>
      </div>
    </div>
  );
});

PrintReportV2.displayName = "PrintReportV2";
export default PrintReportV2;





// // PrintReportV2.jsx
// import React, { forwardRef, useMemo } from "react";

// /**
//  * PrintReportV2
//  * - Keeps PrintReport (v1) color theme
//  * - Uses PrintReportV2 (your provided V2) CONTENT STRUCTURE
//  * - Dependency-free, safe helpers included
//  *
//  * Props:
//  *  - reportMeta (from iship_report_meta_v1)
//  *  - analysis   (prepared in SummaryV2)
//  *  - modelName  (string)
//  */

// const IMAGE_HEIGHT = 240;
// const PHOTOS_PER_BLOCK = 4; // 2x2 grid

// function safeString(v) {
//   if (v === null || v === undefined) return "";
//   if (typeof v === "string") return v;
//   if (typeof v === "number" || typeof v === "boolean") return String(v);
//   return "";
// }

// function toTextList(v) {
//   if (v === null || v === undefined) return [];
//   if (Array.isArray(v)) return v.map((x) => safeString(x)).map((s) => s.trim()).filter(Boolean);

//   const s = safeString(v).trim();
//   if (!s) return [];
//   if (s.includes("\n")) return s.split("\n").map((x) => x.trim()).filter(Boolean);
//   return s.split(";").map((x) => x.trim()).filter(Boolean);
// }

// function normalizeCondition(raw) {
//   const s = safeString(raw).trim().toLowerCase();
//   if (!s) return "none";
//   if (["none", "na", "n/a", "ok", "satisfactory", "good"].includes(s)) return "none";
//   if (["rust", "corrosion", "rusting"].includes(s)) return "rust";
//   if (["attention", "issue", "problem", "concern", "nonconformity", "non-conformity"].includes(s)) return "attention";
//   if (["defect", "defective"].includes(s)) return "defect";
//   // support your original conditions too
//   if (["fire_hazard", "trip_fall"].includes(s)) return s;
//   return s;
// }

// function normalizeSeverity(raw) {
//   const s = safeString(raw).trim().toLowerCase();
//   if (!s) return "";
//   if (["low", "minor"].includes(s)) return "low";
//   if (["medium", "moderate"].includes(s)) return "medium";
//   if (["high", "major"].includes(s)) return "high";
//   if (["extreme", "critical"].includes(s)) return "critical";
//   return s;
// }

// function normalizePriority(raw) {
//   const s = safeString(raw).trim().toLowerCase();
//   if (!s) return "";
//   if (["low"].includes(s)) return "low";
//   if (["medium", "normal"].includes(s)) return "medium";
//   if (["high", "urgent"].includes(s)) return "high";
//   if (["critical", "immediate", "immediate action required"].includes(s)) return "critical";
//   return s;
// }

// function chunk(arr, size) {
//   const out = [];
//   const a = Array.isArray(arr) ? arr : [];
//   for (let i = 0; i < a.length; i += size) out.push(a.slice(i, i + size));
//   return out;
// }

// function defaultAbbreviations() {
//   return [
//     "IMO = International Maritime Organization",
//     "ISM = International Safety Management",
//     "PSC = Port State Control",
//     "PPE = Personal Protective Equipment",
//     "NCR = Non-Conformity Report",
//     "SMS = Safety Management System",
//     "ETA = Estimated Time of Arrival",
//     "ETD = Estimated Time of Departure",
//     "LOA = Length Overall",
//     "GT = Gross Tonnage",
//     "DWT = Deadweight Tonnage",
//     "SOP = Standard Operating Procedure",
//   ];
// }

// function uniq(arr) {
//   const out = [];
//   const seen = new Set();
//   for (const x of arr || []) {
//     const k = safeString(x).trim();
//     if (!k) continue;
//     if (seen.has(k)) continue;
//     seen.add(k);
//     out.push(k);
//   }
//   return out;
// }

// function computeOverallRating({ avgScore, defectsVisible }) {
//   let scoreNum = Number(avgScore);
//   const hasAvg = !Number.isNaN(scoreNum) && Number.isFinite(scoreNum);

//   // if 0-5-ish scale, map to 0-100
//   if (hasAvg && scoreNum > 0 && scoreNum <= 5.5) scoreNum = scoreNum * 20;

//   const defects = Array.isArray(defectsVisible) ? defectsVisible : [];
//   const crit = defects.filter(
//     (d) => normalizeSeverity(d.severity) === "critical" || normalizePriority(d.priority) === "critical"
//   ).length;
//   const high = defects.filter((d) => normalizeSeverity(d.severity) === "high").length;

//   let derivedScore = hasAvg ? scoreNum : 80;
//   derivedScore -= crit * 8;
//   derivedScore -= high * 3;

//   if (derivedScore < 0) derivedScore = 0;
//   if (derivedScore > 100) derivedScore = 100;

//   let label = "Good";
//   if (derivedScore >= 85) label = "Excellent";
//   else if (derivedScore >= 70) label = "Good";
//   else if (derivedScore >= 55) label = "Fair";
//   else label = "Poor";

//   return { score: Math.round(derivedScore), label, crit, high };
// }

// function summarizeCommercialImpact(defectsVisible) {
//   const defects = Array.isArray(defectsVisible) ? defectsVisible : [];
//   const crit = defects.filter(
//     (d) => normalizeSeverity(d.severity) === "critical" || normalizePriority(d.priority) === "critical"
//   );
//   const high = defects.filter((d) => normalizeSeverity(d.severity) === "high");

//   const impacts = [];
//   if (crit.length) impacts.push("High risk of operational disruption / off-hire / detention for critical items.");
//   if (high.length) impacts.push("Elevated maintenance and compliance exposure for high-severity items.");
//   if (!crit.length && !high.length)
//     impacts.push("No critical/high items flagged; impacts are primarily routine maintenance and housekeeping.");

//   return { crit, high, impacts };
// }

// function groupPhotosByLocation(perImageNormalized) {
//   const items = Array.isArray(perImageNormalized) ? perImageNormalized : [];
//   const groups = new Map();
//   for (const it of items) {
//     const loc = safeString(it.__location || it.location || it.area).trim() || "Unspecified area";
//     if (!groups.has(loc)) groups.set(loc, []);
//     groups.get(loc).push(it);
//   }
//   return Array.from(groups.entries()).map(([location, list]) => ({ location, items: list }));
// }

// function effectiveConditionForPrint(it) {
//   const stored = normalizeCondition(it?.__condition || it?.condition || it?.condition_type);
//   const sev = normalizeSeverity(it?.__severity || it?.severity);
//   const pri = normalizePriority(it?.__priority || it?.priority);
//   const recs = it?.__recommendations || toTextList(it?.recommendations_high_severity_only || it?.recommendations);

//   if (stored === "none") {
//     if (recs.length) return "attention";
//     if (["high", "critical"].includes(sev)) return "attention";
//     if (pri === "critical") return "attention";
//   }
//   return stored || "none";
// }

// function conditionLabel(cond) {
//   const c = normalizeCondition(cond);
//   const map = {
//     fire_hazard: "Fire hazard",
//     trip_fall: "Trip / fall",
//     none: "Satisfactory",
//     rust: "Rust",
//     attention: "Attention",
//     defect: "Defect",
//   };
//   return map[c] || c.toUpperCase();
// }

// function kpiFromDefects(defectsVisible) {
//   const list = Array.isArray(defectsVisible) ? defectsVisible : [];
//   const total = list.length;
//   const critical = list.filter(
//     (d) => normalizeSeverity(d.severity) === "critical" || normalizePriority(d.priority) === "critical"
//   ).length;
//   const high = list.filter((d) => normalizeSeverity(d.severity) === "high").length;
//   return { total, critical, high };
// }

// const PrintReportV2 = forwardRef(function PrintReportV2({ reportMeta, analysis, modelName }, ref) {
//   const meta = reportMeta || {};
//   const a = analysis || {};

//   const vessel = meta.vessel || {};
//   const inspector = meta.inspector || {};
//   const movement = meta.vesselMovement || {};
//   const crew = meta.crew || {};

//   const perImageNormalized = Array.isArray(a.perImageNormalized) ? a.perImageNormalized : [];
//   const defectsVisible = Array.isArray(a.defectsVisible) ? a.defectsVisible : [];

//   const abbreviations = useMemo(() => {
//     const merged = uniq([...(defaultAbbreviations() || []), ...(meta.abbreviationsCustom || [])]);
//     return merged.sort((x, y) => safeString(x).localeCompare(safeString(y)));
//   }, [meta.abbreviationsCustom]);

//   const rating = useMemo(() => {
//     if (meta?.ratingOverride?.useOverride) {
//       const score = Number(meta?.ratingOverride?.score);
//       const label = safeString(meta?.ratingOverride?.label) || "Override";
//       return {
//         score: Number.isFinite(score) ? score : "",
//         label,
//         crit: 0,
//         high: 0,
//         overrideRationale: safeString(meta?.ratingOverride?.rationale),
//         isOverride: true,
//       };
//     }
//     return { ...computeOverallRating({ avgScore: a.avgScore, defectsVisible }), isOverride: false };
//   }, [a.avgScore, defectsVisible, meta?.ratingOverride]);

//   const commercial = useMemo(() => summarizeCommercialImpact(defectsVisible), [defectsVisible]);

//   const photoGroups = useMemo(() => groupPhotosByLocation(perImageNormalized), [perImageNormalized]);

//   const executiveSummaryText = useMemo(() => {
//     if (meta?.executiveSummary?.useManual && safeString(meta?.executiveSummary?.text).trim()) {
//       return safeString(meta.executiveSummary.text);
//     }

//     const topCritical = commercial.crit.slice(0, 5).map((d) => {
//       const loc = safeString(d.location || d.area).trim();
//       const rec = (d.recommendations || []).slice(0, 2).join("; ");
//       return `• ${conditionLabel(d.condition)}${loc ? ` @ ${loc}` : ""}: ${safeString(d.comment).trim() || "Issue flagged"}${
//         rec ? ` (Action: ${rec})` : ""
//       }`;
//     });

//     const headline = [
//       `Inspection summary generated from model: ${safeString(modelName || "N/A")}.`,
//       `Overall vessel rating: ${safeString(rating.label)}${rating.score !== "" ? ` (${rating.score}/100)` : ""}.`,
//       commercial.crit.length ? `Critical items identified: ${commercial.crit.length}.` : "No critical items identified.",
//       commercial.high.length ? `High-severity items identified: ${commercial.high.length}.` : "No high-severity items identified.",
//     ];

//     return [...headline, "", "Key Highlights:", ...(topCritical.length ? topCritical : ["• No critical highlights available."])].join("\n");
//   }, [meta?.executiveSummary, modelName, rating, commercial]);

//   const defectsKpi = useMemo(() => kpiFromDefects(defectsVisible), [defectsVisible]);

//   return (
//     <div ref={ref} className="print-root" style={{ background: "white", color: "#111827" }}>
//       <style>{`
//         @page { size: A4; margin: 18mm 14mm; }
//         @media print {
//           html, body {
//             background: #fff !important;
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }
//           .print-page { break-after: page; page-break-after: always; }
//           .print-page:last-child { break-after: auto; page-break-after: auto; }
//           .no-break { break-inside: avoid; page-break-inside: avoid; }
//           h1, h2, h3, p, table, tr, td, th, img { break-inside: avoid; page-break-inside: avoid; }
//           table { break-inside: auto; page-break-inside: auto; }
//           tr { break-inside: avoid; page-break-inside: avoid; }
//           .wrap { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
//           img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
//         }

//         .page-pad { padding: 18px 18px; }
//         .muted { color: #4B5563; font-size: 12px; }
//         .rule { margin: 14px 0; border: none; border-top: 1px solid #E5E7EB; }

//         /* V1 THEME (blue) */
//         .hdr {
//           border: 1px solid #DBEAFE;
//           background: #EFF6FF;
//           border-radius: 14px;
//           padding: 14px 14px;
//         }
//         .hdrTitle { font-size: 22px; font-weight: 900; color: #0F172A; margin: 0; }
//         .hdrSub { margin-top: 6px; font-size: 12px; color: #475569; }
//         .hdrMeta { font-size: 12px; color: #334155; text-align: right; }

//         .secTitle { font-size: 16px; font-weight: 900; color: #0F172A; margin: 0; }
//         .secNote { font-size: 12px; color: #475569; margin-top: 6px; }

//         .card {
//           border: 1px solid #E5E7EB;
//           border-radius: 14px;
//           background: #FFFFFF;
//           padding: 12px;
//         }

//         .twoCol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; font-size: 12px; }
//         .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
//         .grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }

//         .kpiGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
//         .kpiBox {
//           border: 1px solid #E5E7EB;
//           border-radius: 12px;
//           padding: 12px;
//           background: #FFFFFF;
//         }
//         .kpiLabel { font-size: 11px; color: #64748B; }
//         .kpiValue { font-size: 20px; font-weight: 900; color: #0F172A; margin-top: 2px; }
//         .kpiFire { border-left: 6px solid #EF4444; }
//         .kpiTrip { border-left: 6px solid #F59E0B; }
//         .kpiOk { border-left: 6px solid #10B981; }
//         .kpiBlue { border-left: 6px solid #2563EB; }
//         .kpiViolet { border-left: 6px solid #7C3AED; }

//         table { width: 100%; border-collapse: collapse; font-size: 12px; }
//         th {
//           text-align: left;
//           border-bottom: 1px solid #E5E7EB;
//           padding: 8px;
//           background: #F8FAFC;
//           color: #334155;
//           font-weight: 800;
//         }
//         td { border-bottom: 1px solid #F1F5F9; padding: 8px; vertical-align: top; color: #111827; }

//         .badge {
//           display:inline-flex;
//           align-items:center;
//           gap:6px;
//           font-size: 11px;
//           padding: 3px 10px;
//           border-radius: 999px;
//           border: 1px solid #e5e7eb;
//           background: #f9fafb;
//           color: #0f172a;
//           font-weight: 700;
//         }
//         .badge.none { background:#ecfeff; border-color:#a5f3fc; }
//         .badge.attention { background:#fffbeb; border-color:#fcd34d; }
//         .badge.rust { background:#fff7ed; border-color:#fdba74; }
//         .badge.defect { background:#fef2f2; border-color:#fca5a5; }
//         .badge.fire_hazard { background:#fef2f2; border-color:#fecaca; }
//         .badge.trip_fall { background:#fffbeb; border-color:#fde68a; }

//         .imgGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
//         .imgCard { border: 1px solid #E5E7EB; border-radius: 12px; padding: 10px; background: #FFFFFF; }
//         .img {
//           width: 100%;
//           height: ${IMAGE_HEIGHT}px;
//           object-fit: contain;
//           background: #F8FAFC;
//           border-radius: 10px;
//           border: 1px solid #E5E7EB;
//           display: block;
//         }

//         .mini { font-size: 11px; color:#374151; }
//         .list { margin: 0; padding-left: 18px; }
//       `}</style>

//       {/* PAGE 1: Header + quick KPIs */}
//       <div className="print-page page-pad">
//         <div className="hdr no-break" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
//           <div>
//             <h1 className="hdrTitle">Vessel Inspection Report</h1>
//             <div className="hdrSub">
//               Generated by iShip Inspection AI • Model: <b>{safeString(modelName || "—")}</b>
//             </div>
//           </div>
//           <div className="hdrMeta">
//             <div>
//               <b>Inspection Date:</b> {safeString(inspector.inspectionDate || "—")}
//             </div>
//             <div>
//               <b>Location:</b> {safeString(inspector.inspectionLocation || "—")}
//             </div>
//             <div>
//               <b>Inspector:</b> {safeString(inspector.name || "—")}
//             </div>
//           </div>
//         </div>

//         <hr className="rule" />

//         <div className="twoCol no-break">
//           <div>
//             <b>Vessel Name:</b> {safeString(vessel.name || "—")}
//           </div>
//           <div>
//             <b>IMO:</b> {safeString(vessel.imo || "—")}
//           </div>
//           <div>
//             <b>Flag:</b> {safeString(vessel.flag || "—")}
//           </div>
//           <div>
//             <b>Call Sign:</b> {safeString(vessel.callSign || vessel.call_sign || "—")}
//           </div>
//         </div>

//         <hr className="rule" />

//         <div className="kpiGrid no-break">
//           <div className="kpiBox kpiBlue">
//             <div className="kpiLabel">Overall Rating</div>
//             <div className="kpiValue">{safeString(rating.label || "—")}</div>
//             <div className="muted">{rating.score !== "" ? `${rating.score}/100` : "—"}</div>
//           </div>
//           <div className="kpiBox kpiViolet">
//             <div className="kpiLabel">Defects</div>
//             <div className="kpiValue">{defectsKpi.total}</div>
//             <div className="muted">
//               Critical: <b>{defectsKpi.critical}</b> • High: <b>{defectsKpi.high}</b>
//             </div>
//           </div>
//           <div className="kpiBox kpiOk">
//             <div className="kpiLabel">Photos Analyzed</div>
//             <div className="kpiValue">{perImageNormalized.length}</div>
//             <div className="muted">Grouped by location in gallery</div>
//           </div>
//         </div>

//         <hr className="rule" />

//         <div className="card no-break">
//           <p className="secTitle">Index</p>
//           <ol className="mini wrap list" style={{ marginTop: 10 }}>
//             <li>Disclaimer</li>
//             <li>Distribution List</li>
//             <li>Terms and Abbreviations</li>
//             <li>References</li>
//             <li>Vessel Particulars</li>
//             <li>Inspector&apos;s Particulars</li>
//             <li>Vessel Movement</li>
//             <li>Crew Particulars</li>
//             <li>Executive Summary</li>
//             <li>Overall Rating of the Vessel</li>
//             <li>Summary of Findings and Commercial Impact</li>
//             <li>Photo Gallery</li>
//           </ol>
//           <p className="muted" style={{ marginTop: 10 }}>
//             Note: Printed page numbers may vary based on printer/PDF settings.
//           </p>
//         </div>
//       </div>

//       {/* Disclaimer */}
//       <div className="print-page page-pad">
//         <div className="card no-break">
//           <p className="secTitle">Disclaimer</p>
//           <div className="wrap mini" style={{ marginTop: 10 }}>
//             {safeString(meta.disclaimer || "—")}
//           </div>
//         </div>

//         <hr className="rule" />

//         <div className="card no-break">
//           <p className="secTitle">Distribution List</p>
//           <div style={{ marginTop: 10 }}>
//             <table>
//               <thead>
//                 <tr>
//                   <th style={{ width: "20%" }}>Role</th>
//                   <th style={{ width: "35%" }}>Name</th>
//                   <th style={{ width: "45%" }}>Email</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {(meta.distribution || []).map((r, idx) => (
//                   <tr key={idx}>
//                     <td>{safeString(r.role)}</td>
//                     <td>{safeString(r.name)}</td>
//                     <td>{safeString(r.email)}</td>
//                   </tr>
//                 ))}
//                 {(!meta.distribution || meta.distribution.length === 0) && (
//                   <tr>
//                     <td colSpan={3} className="muted">
//                       No distribution entries provided.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         <hr className="rule" />

//         <div className="card no-break">
//           <p className="secTitle">Terms and Abbreviations</p>
//           <div className="wrap mini" style={{ marginTop: 10 }}>
//             <div style={{ fontWeight: 900, color: "#0F172A", marginBottom: 6 }}>Abbreviations</div>
//             <ul className="list">
//               {abbreviations.map((x, i) => (
//                 <li key={i}>{x}</li>
//               ))}
//             </ul>

//             <hr className="rule" />

//             <div style={{ fontWeight: 900, color: "#0F172A", marginBottom: 6 }}>Terms</div>
//             <ul className="list">
//               <li>
//                 <b>Observation:</b> A recorded condition noted during inspection (may or may not require action).
//               </li>
//               <li>
//                 <b>Defect / Non-conformity:</b> A condition requiring attention or corrective action as per best practice / SOP.
//               </li>
//               <li>
//                 <b>Severity:</b> Indicative impact level (low/medium/high/critical).
//               </li>
//               <li>
//                 <b>Priority:</b> Urgency for action (low/medium/high/critical).
//               </li>
//             </ul>
//           </div>
//         </div>
//       </div>

//       {/* References + Particulars */}
//       <div className="print-page page-pad">
//         <div className="card no-break">
//           <p className="secTitle">References</p>
//           <div className="wrap mini" style={{ marginTop: 10 }}>
//             {Array.isArray(meta.references) && meta.references.length ? (
//               <ul className="list">
//                 {meta.references.map((r, i) => (
//                   <li key={i}>{safeString(r)}</li>
//                 ))}
//               </ul>
//             ) : (
//               <div className="muted">No references provided.</div>
//             )}
//           </div>
//         </div>

//         <hr className="rule" />

//         <div className="card no-break">
//           <p className="secTitle">Vessel Particulars</p>
//           <div style={{ marginTop: 10 }}>
//             <table>
//               <tbody>
//                 {[
//                   ["Vessel Name", vessel.name],
//                   ["IMO", vessel.imo],
//                   ["Flag", vessel.flag],
//                   ["Class", vessel.class],
//                   ["Type", vessel.type],
//                   ["DWT", vessel.dwt],
//                   ["GT", vessel.gt],
//                   ["LOA", vessel.loa],
//                   ["Beam", vessel.beam],
//                   ["Year Built", vessel.yearBuilt],
//                   ["Port of Registry", vessel.portOfRegistry],
//                   ["Call Sign", vessel.callSign],
//                 ].map(([k, v]) => (
//                   <tr key={k}>
//                     <th style={{ width: "30%" }}>{k}</th>
//                     <td className="wrap">{safeString(v || "—")}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         <hr className="rule" />

//         <div className="card no-break">
//           <p className="secTitle">Inspector&apos;s Particulars</p>
//           <div style={{ marginTop: 10 }}>
//             <table>
//               <tbody>
//                 {[
//                   ["Inspector Name", inspector.name],
//                   ["Company", inspector.company],
//                   ["Email", inspector.email],
//                   ["Phone", inspector.phone],
//                   ["Credentials", inspector.credentials],
//                   ["Inspection Date", inspector.inspectionDate],
//                   ["Inspection Location", inspector.inspectionLocation],
//                 ].map(([k, v]) => (
//                   <tr key={k}>
//                     <th style={{ width: "30%" }}>{k}</th>
//                     <td className="wrap">{safeString(v || "—")}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {/* Vessel movement + crew */}
//       <div className="print-page page-pad">
//         <div className="card no-break">
//           <p className="secTitle">Vessel Movement</p>
//           <div style={{ marginTop: 10 }}>
//             <table>
//               <tbody>
//                 {[
//                   ["Last Port", movement.lastPort],
//                   ["Current Port", movement.currentPort],
//                   ["Next Port", movement.nextPort],
//                   ["ETA", movement.eta],
//                   ["ETD", movement.etd],
//                   ["Berth / Anchorage", movement.berthOrAnchorage],
//                   ["Voyage Notes", movement.voyageNotes],
//                 ].map(([k, v]) => (
//                   <tr key={k}>
//                     <th style={{ width: "30%" }}>{k}</th>
//                     <td className="wrap">{safeString(v || "—")}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         <hr className="rule" />

//         <div className="card no-break">
//           <p className="secTitle">Crew Particulars</p>
//           <div style={{ marginTop: 10 }}>
//             <table>
//               <tbody>
//                 {[
//                   ["Total Crew", crew.total],
//                   ["Officers", crew.officers],
//                   ["Ratings", crew.ratings],
//                   ["Nationalities Summary", crew.nationalities],
//                   ["Key Officers", crew.keyOfficers],
//                 ].map(([k, v]) => (
//                   <tr key={k}>
//                     <th style={{ width: "30%" }}>{k}</th>
//                     <td className="wrap">{safeString(v || "—")}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         <hr className="rule" />

//         <div className="card no-break">
//           <p className="secTitle">Executive Summary</p>
//           <div className="wrap mini" style={{ marginTop: 10 }}>
//             {executiveSummaryText || "—"}
//           </div>
//         </div>
//       </div>

//       {/* Overall rating + commercial impact */}
//       <div className="print-page page-pad">
//         <div className="card no-break">
//           <p className="secTitle">Overall Rating of the Vessel</p>

//           <div className="kpiGrid" style={{ marginTop: 10 }}>
//             <div className="kpiBox kpiBlue">
//               <div className="kpiLabel">Rating</div>
//               <div className="kpiValue">{safeString(rating.label || "—")}</div>
//             </div>

//             <div className="kpiBox kpiOk">
//               <div className="kpiLabel">Score</div>
//               <div className="kpiValue">{rating.score !== "" ? `${rating.score}/100` : "—"}</div>
//             </div>

//             <div className="kpiBox kpiViolet">
//               <div className="kpiLabel">Method</div>
//               <div className="kpiValue">{rating.isOverride ? "Manual" : "Auto"}</div>
//             </div>
//           </div>

//           {!rating.isOverride && (
//             <div className="twoCol" style={{ marginTop: 10 }}>
//               <div>
//                 <b>Critical items:</b> {rating.crit}
//               </div>
//               <div>
//                 <b>High-severity items:</b> {rating.high}
//               </div>
//             </div>
//           )}

//           {rating.isOverride && safeString(rating.overrideRationale).trim() ? (
//             <>
//               <hr className="rule" />
//               <div style={{ fontWeight: 900, color: "#0F172A" }}>Override Rationale</div>
//               <div className="wrap mini" style={{ marginTop: 6 }}>
//                 {rating.overrideRationale}
//               </div>
//             </>
//           ) : null}
//         </div>

//         <hr className="rule" />

//         <div className="card">
//           <p className="secTitle">Summary of Findings and Commercial Impact</p>

//           <div style={{ marginTop: 10 }}>
//             <div style={{ fontWeight: 900, color: "#0F172A", marginBottom: 6 }}>Commercial Impact</div>
//             <ul className="list mini">
//               {commercial.impacts.map((x, i) => (
//                 <li key={i}>{x}</li>
//               ))}
//             </ul>
//           </div>

//           <hr className="rule" />

//           <div style={{ fontWeight: 900, color: "#0F172A", marginBottom: 6 }}>Top Critical Findings</div>
//           {commercial.crit.length ? (
//             <table>
//               <thead>
//                 <tr>
//                   <th style={{ width: "18%" }}>Location</th>
//                   <th style={{ width: "14%" }}>Condition</th>
//                   <th style={{ width: "14%" }}>Severity/Priority</th>
//                   <th>Notes</th>
//                   <th style={{ width: "22%" }}>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {commercial.crit.slice(0, 8).map((d) => (
//                   <tr key={d.id}>
//                     <td className="wrap">{safeString(d.location || d.area || "—")}</td>
//                     <td>
//                       <span className={`badge ${normalizeCondition(d.condition)}`}>
//                         {normalizeCondition(d.condition).toUpperCase()}
//                       </span>
//                     </td>
//                     <td className="wrap">
//                       {normalizeSeverity(d.severity) || "—"} / {normalizePriority(d.priority) || "—"}
//                     </td>
//                     <td className="wrap">{safeString(d.comment || "—")}</td>
//                     <td className="wrap">{(d.recommendations || []).slice(0, 3).join("\n") || "—"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           ) : (
//             <div className="muted">No critical findings identified.</div>
//           )}

//           <hr className="rule" />
//           <div className="mini muted">
//             Total defects shown: <b>{defectsVisible.length}</b> • Critical: <b>{commercial.crit.length}</b> • High:{" "}
//             <b>{commercial.high.length}</b>
//           </div>
//         </div>
//       </div>

//       {/* Photo Gallery (Location-wise) */}
//       {photoGroups.map((group) => {
//         const blocks = chunk(group.items, PHOTOS_PER_BLOCK);

//         return blocks.map((blockItems, bi) => (
//           <div key={`${group.location}-${bi}`} className="print-page page-pad">
//             <div className="hdr no-break" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
//               <div>
//                 <div className="hdrTitle" style={{ fontSize: 18 }}>
//                   Photo Gallery — Location-wise Findings
//                 </div>
//                 <div className="hdrSub">
//                   <b>Area:</b> {group.location} {blocks.length > 1 ? `• Part ${bi + 1} of ${blocks.length}` : ""}
//                 </div>
//               </div>
//               <div className="hdrMeta">
//                 <div>
//                   <b>Vessel:</b> {safeString(vessel.name || "—")}
//                 </div>
//                 <div>
//                   <b>Date:</b> {safeString(inspector.inspectionDate || "—")}
//                 </div>
//                 <div>
//                   <b>Port:</b> {safeString(inspector.inspectionLocation || "—")}
//                 </div>
//               </div>
//             </div>

//             <hr className="rule" />

//             <div className="imgGrid">
//               {blockItems.map((it, idx) => {
//                 const cond = effectiveConditionForPrint(it);
//                 const sev = normalizeSeverity(it.__severity || it.severity);
//                 const pri = normalizePriority(it.__priority || it.priority);
//                 const comment = safeString(it.__comment || it.comment || it.comments);
//                 const recs = it.__recommendations || toTextList(it.recommendations_high_severity_only || it.recommendations);
//                 const imageUrl = safeString(it.__imageUrl || it.image_url || it.url);
//                 const sourceIndex =
//                   Number.isFinite(Number(it.__sourceIndex)) ? Number(it.__sourceIndex) : bi * PHOTOS_PER_BLOCK + idx;

//                 return (
//                   <div key={`${safeString(it.id || it.__sourceIndex || sourceIndex)}`} className="imgCard no-break">
//                     <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
//                       <span className={`badge ${normalizeCondition(cond)}`}>{conditionLabel(cond)}</span>
//                       <span className="muted">
//                         #{sourceIndex + 1}
//                         {sev ? ` • ${sev}` : ""}
//                         {pri ? ` • ${pri}` : ""}
//                       </span>
//                     </div>

//                     <div style={{ marginTop: 10 }}>
//                       <img
//                         className="img"
//                         src={imageUrl}
//                         alt={`photo-${sourceIndex}`}
//                         crossOrigin="anonymous"
//                         referrerPolicy="no-referrer"
//                         loading="eager"
//                         onError={(e) => {
//                           e.currentTarget.style.display = "none";
//                         }}
//                       />
//                     </div>

//                     <div style={{ marginTop: 10 }} className="mini wrap">
//                       <b>Impact / Notes:</b> {comment || "—"}
//                     </div>

//                     {(recs || []).length > 0 ? (
//                       <div style={{ marginTop: 8 }} className="mini wrap">
//                         <b>Recommendations:</b> {recs.join("\n")}
//                       </div>
//                     ) : null}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         ));
//       })}

//       {/* Defects & Non-Conformities (Photos) */}
//       <div className="print-page page-pad">
//         <div className="hdr no-break" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
//           <div>
//             <div className="hdrTitle" style={{ fontSize: 18 }}>
//               Defects & Non-Conformities (Photos)
//             </div>
//             <div className="hdrSub">Derived + manual defects with actions & assignments (where available).</div>
//           </div>
//           <div className="hdrMeta">
//             <div>
//               <b>Total:</b> {defectsVisible.length}
//             </div>
//             <div>
//               <b>Critical:</b> {commercial.crit.length}
//             </div>
//             <div>
//               <b>High:</b> {commercial.high.length}
//             </div>
//           </div>
//         </div>

//         <hr className="rule" />

//         {defectsVisible.length ? (
//           <div className="imgGrid">
//             {defectsVisible.map((d) => {
//               const imageUrl = safeString(d.imageUrl);
//               const recs = Array.isArray(d.recommendations) ? d.recommendations : toTextList(d.recommendations);

//               return (
//                 <div key={d.id} className="imgCard no-break">
//                   <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
//                     <span className={`badge ${normalizeCondition(d.condition)}`}>{conditionLabel(d.condition)}</span>
//                     <span className="muted">{d.isDerived ? "Derived" : "Manual"}</span>
//                   </div>

//                   <div className="mini wrap" style={{ marginTop: 8 }}>
//                     <b>Location:</b> {safeString(d.location || d.area || "—")}
//                     {safeString(d.severity).trim() || safeString(d.priority).trim() ? (
//                       <>
//                         {" "}
//                         • <b>Severity/Priority:</b> {normalizeSeverity(d.severity) || "—"} / {normalizePriority(d.priority) || "—"}
//                       </>
//                     ) : null}
//                   </div>

//                   <div style={{ marginTop: 10 }}>
//                     <img
//                       className="img"
//                       src={imageUrl}
//                       alt={d.id}
//                       crossOrigin="anonymous"
//                       referrerPolicy="no-referrer"
//                       loading="eager"
//                       onError={(e) => {
//                         e.currentTarget.style.display = "none";
//                       }}
//                     />
//                   </div>

//                   <div className="mini wrap" style={{ marginTop: 10 }}>
//                     <b>Notes:</b> {safeString(d.comment || "—")}
//                   </div>

//                   {recs.length ? (
//                     <div className="mini wrap" style={{ marginTop: 8 }}>
//                       <b>Actions:</b>
//                       {"\n"}
//                       {recs.slice(0, 4).join("\n")}
//                     </div>
//                   ) : null}

//                   {(safeString(d.assignedTo).trim() || safeString(d.deadline).trim()) ? (
//                     <div className="mini wrap" style={{ marginTop: 8 }}>
//                       <b>Assigned To:</b> {safeString(d.assignedTo || "—")} • <b>Deadline:</b> {safeString(d.deadline || "—")}
//                     </div>
//                   ) : null}
//                 </div>
//               );
//             })}
//           </div>
//         ) : (
//           <div className="muted">No defects available.</div>
//         )}
//       </div>

//       {/* Appendix: All Photos */}
//       {chunk(perImageNormalized, PHOTOS_PER_BLOCK).map((blockItems, bi) => (
//         <div key={`appendix-${bi}`} className="print-page page-pad">
//           <div className="hdr no-break" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
//             <div>
//               <div className="hdrTitle" style={{ fontSize: 18 }}>
//                 Appendix: All Photos
//               </div>
//               <div className="hdrSub">Flat list in inspection order.</div>
//             </div>
//             <div className="hdrMeta">
//               <div>
//                 <b>Block:</b> {bi + 1} / {Math.max(1, Math.ceil(perImageNormalized.length / PHOTOS_PER_BLOCK))}
//               </div>
//               <div>
//                 <b>Total Photos:</b> {perImageNormalized.length}
//               </div>
//             </div>
//           </div>

//           <hr className="rule" />

//           <div className="imgGrid">
//             {blockItems.map((it) => {
//               const imageUrl = safeString(it.__imageUrl || it.image_url || it.url);
//               const loc = safeString(it.__location || it.location || it.area).trim() || "Unspecified area";
//               const cond = effectiveConditionForPrint(it);
//               const comment = safeString(it.__comment || it.comment || it.comments);
//               const sourceIndex = Number.isFinite(Number(it.__sourceIndex)) ? Number(it.__sourceIndex) : 0;

//               return (
//                 <div key={`appendix-item-${safeString(it.id || it.__sourceIndex || `${bi}-${sourceIndex}`)}`} className="imgCard no-break">
//                   <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
//                     <span className={`badge ${normalizeCondition(cond)}`}>{conditionLabel(cond)}</span>
//                     <span className="muted">#{sourceIndex + 1}</span>
//                   </div>

//                   <div className="mini wrap" style={{ marginTop: 8 }}>
//                     <b>Location:</b> {loc}
//                   </div>

//                   <div style={{ marginTop: 10 }}>
//                     <img
//                       className="img"
//                       src={imageUrl}
//                       alt={`appendix-${sourceIndex}`}
//                       crossOrigin="anonymous"
//                       referrerPolicy="no-referrer"
//                       loading="eager"
//                       onError={(e) => {
//                         e.currentTarget.style.display = "none";
//                       }}
//                     />
//                   </div>

//                   <div className="mini wrap" style={{ marginTop: 10 }}>
//                     {comment || "—"}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       ))}

//       {/* Footer */}
//       <div className="page-pad" style={{ textAlign: "center" }}>
//         <div className="muted">
//           Generated by iShip • {safeString(vessel.name || "Vessel")} • Model: {safeString(modelName || "—")}
//         </div>
//       </div>
//     </div>
//   );
// });

// PrintReportV2.displayName = "PrintReportV2";
// export default PrintReportV2;




// // // PrintReportV2.jsx
// // import React, { forwardRef, useMemo } from "react";

// // /**
// //  * PrintReportV2
// //  * - Dependency-free printable report
// //  * - Consumes:
// //  *   reportMeta (from iship_report_meta_v1)
// //  *   analysis (normalized + prepared in SummaryV2)
// //  *
// //  * NOTE: This file intentionally duplicates tiny helpers to avoid any shared dependency.
// //  */

// // function safeString(v) {
// //   if (v === null || v === undefined) return "";
// //   if (typeof v === "string") return v;
// //   if (typeof v === "number" || typeof v === "boolean") return String(v);
// //   return "";
// // }

// // function toTextList(v) {
// //   if (v === null || v === undefined) return [];
// //   if (Array.isArray(v)) return v.map((x) => safeString(x)).filter(Boolean);
// //   const s = safeString(v).trim();
// //   if (!s) return [];
// //   if (s.includes("\n")) return s.split("\n").map((x) => x.trim()).filter(Boolean);
// //   return s.split(",").map((x) => x.trim()).filter(Boolean);
// // }

// // function normalizeCondition(raw) {
// //   const s = safeString(raw).trim().toLowerCase();
// //   if (!s) return "none";
// //   if (["none", "na", "n/a", "ok", "satisfactory", "good"].includes(s)) return "none";
// //   if (["rust", "corrosion", "rusting"].includes(s)) return "rust";
// //   if (["attention", "issue", "problem", "concern", "nonconformity", "non-conformity"].includes(s))
// //     return "attention";
// //   if (["defect", "defective"].includes(s)) return "defect";
// //   return s;
// // }

// // function normalizeSeverity(raw) {
// //   const s = safeString(raw).trim().toLowerCase();
// //   if (!s) return "";
// //   if (["low", "minor"].includes(s)) return "low";
// //   if (["medium", "moderate"].includes(s)) return "medium";
// //   if (["high", "major"].includes(s)) return "high";
// //   if (["extreme", "critical"].includes(s)) return "critical";
// //   return s;
// // }

// // function normalizePriority(raw) {
// //   const s = safeString(raw).trim().toLowerCase();
// //   if (!s) return "";
// //   if (["low"].includes(s)) return "low";
// //   if (["medium", "normal"].includes(s)) return "medium";
// //   if (["high", "urgent"].includes(s)) return "high";
// //   if (["critical", "immediate", "immediate action required"].includes(s)) return "critical";
// //   return s;
// // }

// // function chunk(arr, size) {
// //   const out = [];
// //   const a = Array.isArray(arr) ? arr : [];
// //   for (let i = 0; i < a.length; i += size) out.push(a.slice(i, i + size));
// //   return out;
// // }

// // function defaultAbbreviations() {
// //   return [
// //     "IMO = International Maritime Organization",
// //     "ISM = International Safety Management",
// //     "PSC = Port State Control",
// //     "PPE = Personal Protective Equipment",
// //     "NCR = Non-Conformity Report",
// //     "SMS = Safety Management System",
// //     "ETA = Estimated Time of Arrival",
// //     "ETD = Estimated Time of Departure",
// //     "LOA = Length Overall",
// //     "GT = Gross Tonnage",
// //     "DWT = Deadweight Tonnage",
// //     "SOP = Standard Operating Procedure",
// //   ];
// // }

// // function uniq(arr) {
// //   const out = [];
// //   const seen = new Set();
// //   for (const x of arr || []) {
// //     const k = safeString(x);
// //     if (!k) continue;
// //     if (seen.has(k)) continue;
// //     seen.add(k);
// //     out.push(k);
// //   }
// //   return out;
// // }

// // function computeOverallRating({ avgScore, defectsVisible }) {
// //   // 1) If override-like numeric score present, use it (mapped to 0-100)
// //   let scoreNum = Number(avgScore);
// //   const hasAvg = !Number.isNaN(scoreNum) && Number.isFinite(scoreNum);

// //   // detect scale: if 0-5-ish, map to 0-100
// //   if (hasAvg && scoreNum > 0 && scoreNum <= 5.5) scoreNum = scoreNum * 20;

// //   // 2) Penalize for critical defects
// //   const defects = Array.isArray(defectsVisible) ? defectsVisible : [];
// //   const crit = defects.filter((d) => normalizeSeverity(d.severity) === "critical" || normalizePriority(d.priority) === "critical").length;
// //   const high = defects.filter((d) => normalizeSeverity(d.severity) === "high").length;

// //   let derivedScore = hasAvg ? scoreNum : 80;
// //   derivedScore -= crit * 8;
// //   derivedScore -= high * 3;

// //   if (derivedScore < 0) derivedScore = 0;
// //   if (derivedScore > 100) derivedScore = 100;

// //   let label = "Good";
// //   if (derivedScore >= 85) label = "Excellent";
// //   else if (derivedScore >= 70) label = "Good";
// //   else if (derivedScore >= 55) label = "Fair";
// //   else label = "Poor";

// //   return { score: Math.round(derivedScore), label, crit, high };
// // }

// // function summarizeCommercialImpact(defectsVisible) {
// //   const defects = Array.isArray(defectsVisible) ? defectsVisible : [];
// //   const crit = defects.filter((d) => normalizeSeverity(d.severity) === "critical" || normalizePriority(d.priority) === "critical");
// //   const high = defects.filter((d) => normalizeSeverity(d.severity) === "high");

// //   const impacts = [];
// //   if (crit.length) impacts.push("High risk of operational disruption / off-hire / detention for critical items.");
// //   if (high.length) impacts.push("Elevated maintenance and compliance exposure for high-severity items.");
// //   if (!crit.length && !high.length) impacts.push("No critical/high items flagged; impacts are primarily routine maintenance and housekeeping.");

// //   return { crit, high, impacts };
// // }

// // function groupPhotosByLocation(perImageNormalized) {
// //   const items = Array.isArray(perImageNormalized) ? perImageNormalized : [];
// //   const groups = new Map();
// //   for (const it of items) {
// //     const loc = safeString(it.__location || it.location || it.area).trim() || "Unspecified area";
// //     if (!groups.has(loc)) groups.set(loc, []);
// //     groups.get(loc).push(it);
// //   }
// //   return Array.from(groups.entries()).map(([location, list]) => ({ location, items: list }));
// // }

// // function effectiveConditionForPrint(it) {
// //   // We assume perImageNormalized already contains stored + effective condition logic in SummaryV2.
// //   // But to stay resilient, fall back:
// //   const stored = normalizeCondition(it?.__condition || it?.condition || it?.condition_type);
// //   const sev = normalizeSeverity(it?.__severity || it?.severity);
// //   const pri = normalizePriority(it?.__priority || it?.priority);
// //   const recs = it?.__recommendations || toTextList(it?.recommendations_high_severity_only || it?.recommendations);

// //   // if stored none but has signals, treat as attention
// //   if (stored === "none") {
// //     if (recs.length) return "attention";
// //     if (["high", "critical"].includes(sev)) return "attention";
// //     if (pri === "critical") return "attention";
// //   }
// //   return stored || "none";
// // }

// // const PrintReportV2 = forwardRef(function PrintReportV2(
// //   { reportMeta, analysis, modelName },
// //   ref
// // ) {
// //   const meta = reportMeta || {};
// //   const a = analysis || {};
// //   const vessel = meta.vessel || {};
// //   const inspector = meta.inspector || {};
// //   const movement = meta.vesselMovement || {};
// //   const crew = meta.crew || {};

// //   const perImageNormalized = Array.isArray(a.perImageNormalized) ? a.perImageNormalized : [];
// //   const defectsVisible = Array.isArray(a.defectsVisible) ? a.defectsVisible : [];

// //   const abbreviations = useMemo(() => {
// //     const merged = uniq([...(defaultAbbreviations()), ...(meta.abbreviationsCustom || [])]);
// //     return merged.sort((x, y) => safeString(x).localeCompare(safeString(y)));
// //   }, [meta.abbreviationsCustom]);

// //   const rating = useMemo(() => {
// //     if (meta?.ratingOverride?.useOverride) {
// //       const score = Number(meta?.ratingOverride?.score);
// //       const label = safeString(meta?.ratingOverride?.label) || "Override";
// //       return {
// //         score: Number.isFinite(score) ? score : "",
// //         label,
// //         crit: 0,
// //         high: 0,
// //         overrideRationale: safeString(meta?.ratingOverride?.rationale),
// //         isOverride: true,
// //       };
// //     }
// //     return { ...computeOverallRating({ avgScore: a.avgScore, defectsVisible }), isOverride: false };
// //   }, [a.avgScore, defectsVisible, meta?.ratingOverride]);

// //   const commercial = useMemo(() => summarizeCommercialImpact(defectsVisible), [defectsVisible]);

// //   const photoGroups = useMemo(() => groupPhotosByLocation(perImageNormalized), [perImageNormalized]);

// //   const executiveSummaryText = useMemo(() => {
// //     if (meta?.executiveSummary?.useManual && safeString(meta?.executiveSummary?.text).trim()) {
// //       return safeString(meta.executiveSummary.text);
// //     }

// //     const topCritical = commercial.crit.slice(0, 5).map((d) => {
// //       const loc = safeString(d.location || d.area).trim();
// //       const rec = (d.recommendations || []).slice(0, 2).join("; ");
// //       return `• ${normalizeCondition(d.condition).toUpperCase()}${loc ? ` @ ${loc}` : ""}: ${safeString(d.comment).trim() || "Issue flagged"}${rec ? ` (Action: ${rec})` : ""}`;
// //     });

// //     const headline = [
// //       `Inspection summary generated from model: ${safeString(modelName || "N/A")}.`,
// //       `Overall vessel rating: ${safeString(rating.label)}${rating.score !== "" ? ` (${rating.score}/100)` : ""}.`,
// //       commercial.crit.length
// //         ? `Critical items identified: ${commercial.crit.length}.`
// //         : "No critical items identified.",
// //       commercial.high.length
// //         ? `High-severity items identified: ${commercial.high.length}.`
// //         : "No high-severity items identified.",
// //     ];

// //     return [...headline, "", "Key Highlights:", ...(topCritical.length ? topCritical : ["• No critical highlights available."])].join("\n");
// //   }, [meta?.executiveSummary, modelName, rating, commercial]);

// //   const styles = (
// //     <style>{`
// //       * { box-sizing: border-box; }
// //       .report {
// //         width: 794px; /* A4-ish @ 96dpi */
// //         margin: 0 auto;
// //         padding: 24px;
// //         font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
// //         color: #111827;
// //       }
// //       .muted { color: #6b7280; font-size: 12px; }
// //       .h1 { font-size: 22px; font-weight: 800; margin: 0; }
// //       .h2 { font-size: 16px; font-weight: 800; margin: 0 0 10px; }
// //       .h3 { font-size: 13px; font-weight: 800; margin: 0 0 8px; }
// //       .section { margin-top: 18px; }
// //       .card {
// //         border: 1px solid #e5e7eb;
// //         border-radius: 16px;
// //         padding: 12px;
// //         background: #fff;
// //       }
// //       .divider { height: 1px; background:#e5e7eb; margin: 10px 0; }
// //       .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
// //       .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
// //       table { width: 100%; border-collapse: collapse; }
// //       th, td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: top; font-size: 12px; }
// //       th { background: #f9fafb; text-align: left; }
// //       .wrap { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
// //       .badge {
// //         display:inline-block; font-size: 11px; padding: 3px 8px; border-radius: 999px;
// //         border: 1px solid #e5e7eb; background: #f9fafb;
// //       }
// //       .badge.none { background:#ecfeff; border-color:#a5f3fc; }
// //       .badge.attention { background:#fffbeb; border-color:#fcd34d; }
// //       .badge.rust { background:#fff7ed; border-color:#fdba74; }
// //       .badge.defect { background:#fef2f2; border-color:#fca5a5; }

// //       .no-break { break-inside: avoid; page-break-inside: avoid; }
// //       .page-break { break-before: page; page-break-before: always; }

// //       .img {
// //         width: 100%;
// //         height: 240px; /* same scale as UI */
// //         object-fit: contain;
// //         background: #f9fafb;
// //         border: 1px solid #e5e7eb;
// //         border-radius: 12px;
// //       }

// //       .mini { font-size: 11px; color:#374151; }
// //       .kpi { display:flex; gap: 10px; flex-wrap: wrap; }
// //       .kpiBox {
// //         border: 1px solid #e5e7eb; border-radius: 14px; padding: 10px; min-width: 160px;
// //         background: #fff;
// //       }
// //       .kpiNum { font-size: 18px; font-weight: 900; }
// //       .kpiLbl { font-size: 12px; color:#6b7280; }
// //     `}</style>
// //   );

// //   return (
// //     <div ref={ref} className="report">
// //       {styles}

// //       {/* Header */}
// //       <div className="card no-break">
// //         <div className="grid2">
// //           <div>
// //             <p className="h1">Vessel Inspection Report</p>
// //             <p className="muted">
// //               Vessel: <b>{safeString(vessel.name || "—")}</b> • IMO: <b>{safeString(vessel.imo || "—")}</b> • Flag:{" "}
// //               <b>{safeString(vessel.flag || "—")}</b>
// //             </p>
// //             <p className="muted">
// //               Inspection Date: <b>{safeString(inspector.inspectionDate || "—")}</b> • Location:{" "}
// //               <b>{safeString(inspector.inspectionLocation || "—")}</b>
// //             </p>
// //           </div>
// //           <div style={{ textAlign: "right" }}>
// //             <p className="muted" style={{ margin: 0 }}>
// //               Prepared by
// //             </p>
// //             <p style={{ margin: 0, fontWeight: 800 }}>{safeString(inspector.name || "—")}</p>
// //             <p className="muted" style={{ margin: 0 }}>
// //               {safeString(inspector.company || "")}
// //             </p>
// //             <p className="muted" style={{ margin: 0 }}>
// //               {safeString(inspector.email || "")} {safeString(inspector.phone || "")}
// //             </p>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Index */}
// //       <div className="section card no-break">
// //         <p className="h2">Index</p>
// //         <ol className="mini wrap" style={{ margin: 0, paddingLeft: 18 }}>
// //           <li>Disclaimer</li>
// //           <li>Distribution List</li>
// //           <li>Terms and Abbreviations</li>
// //           <li>References</li>
// //           <li>Vessel Particulars</li>
// //           <li>Inspector&apos;s Particulars</li>
// //           <li>Vessel Movement</li>
// //           <li>Crew Particulars</li>
// //           <li>Executive Summary</li>
// //           <li>Overall Rating of the Vessel</li>
// //           <li>Summary of Findings and Commercial Impact</li>
// //           <li>Photo Gallery</li>
// //         </ol>
// //         <p className="muted" style={{ marginTop: 8 }}>
// //           Note: Printed page numbers may vary based on printer/PDF settings.
// //         </p>
// //       </div>

// //       {/* Disclaimer */}
// //       <div className="section card no-break">
// //         <p className="h2">Disclaimer</p>
// //         <div className="wrap mini">{safeString(meta.disclaimer)}</div>
// //       </div>

// //       {/* Distribution */}
// //       <div className="section card no-break">
// //         <p className="h2">Distribution List</p>
// //         <table>
// //           <thead>
// //             <tr>
// //               <th style={{ width: "20%" }}>Role</th>
// //               <th style={{ width: "35%" }}>Name</th>
// //               <th style={{ width: "45%" }}>Email</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {(meta.distribution || []).map((r, idx) => (
// //               <tr key={idx}>
// //                 <td>{safeString(r.role)}</td>
// //                 <td>{safeString(r.name)}</td>
// //                 <td>{safeString(r.email)}</td>
// //               </tr>
// //             ))}
// //             {(!meta.distribution || meta.distribution.length === 0) && (
// //               <tr>
// //                 <td colSpan={3} className="muted">
// //                   No distribution entries provided.
// //                 </td>
// //               </tr>
// //             )}
// //           </tbody>
// //         </table>
// //       </div>

// //       {/* Terms & Abbreviations */}
// //       <div className="section card no-break">
// //         <p className="h2">Terms and Abbreviations</p>
// //         <div className="wrap mini">
// //           <p className="h3">Abbreviations</p>
// //           <ul style={{ marginTop: 0, paddingLeft: 18 }}>
// //             {abbreviations.map((x, i) => (
// //               <li key={i}>{x}</li>
// //             ))}
// //           </ul>
// //           <div className="divider" />
// //           <p className="h3">Terms</p>
// //           <ul style={{ marginTop: 0, paddingLeft: 18 }}>
// //             <li>
// //               <b>Observation:</b> A recorded condition noted during inspection (may or may not require action).
// //             </li>
// //             <li>
// //               <b>Defect / Non-conformity:</b> A condition requiring attention or corrective action as per best practice / SOP.
// //             </li>
// //             <li>
// //               <b>Severity:</b> Indicative impact level (low/medium/high/critical).
// //             </li>
// //             <li>
// //               <b>Priority:</b> Urgency for action (low/medium/high/critical).
// //             </li>
// //           </ul>
// //         </div>
// //       </div>

// //       {/* References */}
// //       <div className="section card no-break">
// //         <p className="h2">References</p>
// //         <div className="wrap mini">
// //           {Array.isArray(meta.references) && meta.references.length ? (
// //             <ul style={{ marginTop: 0, paddingLeft: 18 }}>
// //               {meta.references.map((r, i) => (
// //                 <li key={i}>{r}</li>
// //               ))}
// //             </ul>
// //           ) : (
// //             <div className="muted">No references provided.</div>
// //           )}
// //         </div>
// //       </div>

// //       {/* Vessel particulars */}
// //       <div className="section card no-break">
// //         <p className="h2">Vessel Particulars</p>
// //         <table>
// //           <tbody>
// //             {[
// //               ["Vessel Name", vessel.name],
// //               ["IMO", vessel.imo],
// //               ["Flag", vessel.flag],
// //               ["Class", vessel.class],
// //               ["Type", vessel.type],
// //               ["DWT", vessel.dwt],
// //               ["GT", vessel.gt],
// //               ["LOA", vessel.loa],
// //               ["Beam", vessel.beam],
// //               ["Year Built", vessel.yearBuilt],
// //               ["Port of Registry", vessel.portOfRegistry],
// //               ["Call Sign", vessel.callSign],
// //             ].map(([k, v]) => (
// //               <tr key={k}>
// //                 <th style={{ width: "30%" }}>{k}</th>
// //                 <td>{safeString(v || "—")}</td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //       </div>

// //       {/* Inspector particulars */}
// //       <div className="section card no-break">
// //         <p className="h2">Inspector&apos;s Particulars</p>
// //         <table>
// //           <tbody>
// //             {[
// //               ["Inspector Name", inspector.name],
// //               ["Company", inspector.company],
// //               ["Email", inspector.email],
// //               ["Phone", inspector.phone],
// //               ["Credentials", inspector.credentials],
// //               ["Inspection Date", inspector.inspectionDate],
// //               ["Inspection Location", inspector.inspectionLocation],
// //             ].map(([k, v]) => (
// //               <tr key={k}>
// //                 <th style={{ width: "30%" }}>{k}</th>
// //                 <td className="wrap">{safeString(v || "—")}</td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //       </div>

// //       {/* Vessel Movement */}
// //       <div className="section card no-break">
// //         <p className="h2">Vessel Movement</p>
// //         <table>
// //           <tbody>
// //             {[
// //               ["Last Port", movement.lastPort],
// //               ["Current Port", movement.currentPort],
// //               ["Next Port", movement.nextPort],
// //               ["ETA", movement.eta],
// //               ["ETD", movement.etd],
// //               ["Berth / Anchorage", movement.berthOrAnchorage],
// //               ["Voyage Notes", movement.voyageNotes],
// //             ].map(([k, v]) => (
// //               <tr key={k}>
// //                 <th style={{ width: "30%" }}>{k}</th>
// //                 <td className="wrap">{safeString(v || "—")}</td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //       </div>

// //       {/* Crew particulars */}
// //       <div className="section card no-break">
// //         <p className="h2">Crew Particulars</p>
// //         <table>
// //           <tbody>
// //             {[
// //               ["Total Crew", crew.total],
// //               ["Officers", crew.officers],
// //               ["Ratings", crew.ratings],
// //               ["Nationalities Summary", crew.nationalities],
// //               ["Key Officers", crew.keyOfficers],
// //             ].map(([k, v]) => (
// //               <tr key={k}>
// //                 <th style={{ width: "30%" }}>{k}</th>
// //                 <td className="wrap">{safeString(v || "—")}</td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //       </div>

// //       {/* Executive Summary */}
// //       <div className="section card no-break">
// //         <p className="h2">Executive Summary</p>
// //         <div className="wrap mini">{executiveSummaryText}</div>
// //       </div>

// //       {/* Overall rating */}
// //       <div className="section card no-break">
// //         <p className="h2">Overall Rating of the Vessel</p>
// //         <div className="kpi">
// //           <div className="kpiBox">
// //             <div className="kpiNum">{safeString(rating.label)}</div>
// //             <div className="kpiLbl">Rating</div>
// //           </div>
// //           <div className="kpiBox">
// //             <div className="kpiNum">{rating.score !== "" ? `${rating.score}/100` : "—"}</div>
// //             <div className="kpiLbl">Score</div>
// //           </div>
// //           <div className="kpiBox">
// //             <div className="kpiNum">{rating.isOverride ? "Manual" : "Auto"}</div>
// //             <div className="kpiLbl">Method</div>
// //           </div>
// //           {!rating.isOverride && (
// //             <>
// //               <div className="kpiBox">
// //                 <div className="kpiNum">{rating.crit}</div>
// //                 <div className="kpiLbl">Critical items</div>
// //               </div>
// //               <div className="kpiBox">
// //                 <div className="kpiNum">{rating.high}</div>
// //                 <div className="kpiLbl">High-severity items</div>
// //               </div>
// //             </>
// //           )}
// //         </div>
// //         {rating.isOverride && safeString(rating.overrideRationale).trim() && (
// //           <>
// //             <div className="divider" />
// //             <p className="h3">Override Rationale</p>
// //             <div className="wrap mini">{rating.overrideRationale}</div>
// //           </>
// //         )}
// //       </div>

// //       {/* Summary of Findings & Commercial Impact */}
// //       <div className="section card no-break">
// //         <p className="h2">Summary of Findings and Commercial Impact</p>

// //         <p className="h3">Commercial Impact</p>
// //         <ul className="mini" style={{ marginTop: 0, paddingLeft: 18 }}>
// //           {commercial.impacts.map((x, i) => (
// //             <li key={i}>{x}</li>
// //           ))}
// //         </ul>

// //         <div className="divider" />

// //         <p className="h3">Top Critical Findings</p>
// //         {commercial.crit.length ? (
// //           <table>
// //             <thead>
// //               <tr>
// //                 <th style={{ width: "18%" }}>Location</th>
// //                 <th style={{ width: "14%" }}>Condition</th>
// //                 <th style={{ width: "14%" }}>Severity/Priority</th>
// //                 <th>Notes</th>
// //                 <th style={{ width: "22%" }}>Actions</th>
// //               </tr>
// //             </thead>
// //             <tbody>
// //               {commercial.crit.slice(0, 8).map((d) => (
// //                 <tr key={d.id}>
// //                   <td className="wrap">{safeString(d.location || d.area || "—")}</td>
// //                   <td>
// //                     <span className={`badge ${normalizeCondition(d.condition)}`}>{normalizeCondition(d.condition).toUpperCase()}</span>
// //                   </td>
// //                   <td className="wrap">
// //                     {normalizeSeverity(d.severity) || "—"} / {normalizePriority(d.priority) || "—"}
// //                   </td>
// //                   <td className="wrap">{safeString(d.comment || "—")}</td>
// //                   <td className="wrap">{(d.recommendations || []).slice(0, 3).join("\n") || "—"}</td>
// //                 </tr>
// //               ))}
// //             </tbody>
// //           </table>
// //         ) : (
// //           <div className="muted">No critical findings identified.</div>
// //         )}

// //         <div className="divider" />

// //         <p className="h3">All Defects Snapshot</p>
// //         <div className="mini muted">
// //           Total defects shown: <b>{defectsVisible.length}</b> • Critical: <b>{commercial.crit.length}</b> • High:{" "}
// //           <b>{commercial.high.length}</b>
// //         </div>
// //       </div>

// //       {/* Photo Gallery */}
// //       <div className="section card page-break">
// //         <p className="h2">Photo Gallery</p>
// //         <p className="muted">
// //           Photos are grouped by Location/Area. Notes are taken from per-image comment/impact fields.
// //         </p>

// //         {/* Location-wise Photo Findings */}
// //         <div className="divider" />
// //         <p className="h3">Location-wise Photo Findings</p>

// //         {photoGroups.map((group) => {
// //           const pages = chunk(group.items, 4); // 4 per page block
// //           return (
// //             <div key={group.location} className="section">
// //               <div className="card no-break">
// //                 <p className="h3" style={{ marginBottom: 0 }}>
// //                   {group.location}
// //                 </p>
// //                 <p className="muted" style={{ marginTop: 4 }}>
// //                   Photos: {group.items.length}
// //                 </p>
// //               </div>

// //               {pages.map((pageItems, pi) => (
// //                 <div key={pi} className="section">
// //                   <div className="grid2">
// //                     {pageItems.map((it) => {
// //                       const cond = effectiveConditionForPrint(it);
// //                       const sev = normalizeSeverity(it.__severity || it.severity);
// //                       const pri = normalizePriority(it.__priority || it.priority);
// //                       const comment = safeString(it.__comment || it.comment || it.comments);
// //                       const recs = it.__recommendations || toTextList(it.recommendations_high_severity_only || it.recommendations);
// //                       const imageUrl = safeString(it.__imageUrl || it.image_url || it.url);

// //                       return (
// //                         <div key={safeString(it.__sourceIndex)} className="card no-break">
// //                           <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
// //                             <span className={`badge ${normalizeCondition(cond)}`}>{normalizeCondition(cond).toUpperCase()}</span>
// //                             <span className="muted">
// //                               #{Number(it.__sourceIndex) + 1}
// //                               {sev ? ` • ${sev}` : ""}
// //                               {pri ? ` • ${pri}` : ""}
// //                             </span>
// //                           </div>

// //                           <div style={{ marginTop: 8 }}>
// //                             <img
// //                               className="img"
// //                               src={imageUrl}
// //                               alt={`photo-${safeString(it.__sourceIndex)}`}
// //                               crossOrigin="anonymous"
// //                               referrerPolicy="no-referrer"
// //                               onError={(e) => {
// //                                 e.currentTarget.style.display = "none";
// //                               }}
// //                             />
// //                           </div>

// //                           <div className="divider" />
// //                           <p className="h3">Impact / Notes</p>
// //                           <div className="wrap mini">{comment || "—"}</div>

// //                           {(recs || []).length > 0 && (
// //                             <>
// //                               <div className="divider" />
// //                               <p className="h3">Recommendations</p>
// //                               <div className="wrap mini">{recs.join("\n")}</div>
// //                             </>
// //                           )}
// //                         </div>
// //                       );
// //                     })}
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>
// //           );
// //         })}

// //         {/* Defects photos */}
// //         <div className="section page-break">
// //           <p className="h3">Defects & Non-Conformities (Photos)</p>
// //           {defectsVisible.length ? (
// //             <div className="grid2">
// //               {defectsVisible.map((d) => (
// //                 <div key={d.id} className="card no-break">
// //                   <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
// //                     <span className={`badge ${normalizeCondition(d.condition)}`}>{normalizeCondition(d.condition).toUpperCase()}</span>
// //                     <span className="muted">{d.isDerived ? "Derived" : "Manual"}</span>
// //                   </div>
// //                   <div className="muted wrap" style={{ marginTop: 6 }}>
// //                     Location: <b>{safeString(d.location || d.area || "—")}</b>
// //                   </div>
// //                   <div style={{ marginTop: 8 }}>
// //                     <img
// //                       className="img"
// //                       src={safeString(d.imageUrl)}
// //                       alt={d.id}
// //                       crossOrigin="anonymous"
// //                       referrerPolicy="no-referrer"
// //                       onError={(e) => {
// //                         e.currentTarget.style.display = "none";
// //                       }}
// //                     />
// //                   </div>
// //                   <div className="divider" />
// //                   <div className="wrap mini">
// //                     <b>Notes:</b> {safeString(d.comment || "—")}
// //                   </div>
// //                   {(d.recommendations || []).length > 0 && (
// //                     <div className="wrap mini" style={{ marginTop: 6 }}>
// //                       <b>Actions:</b>
// //                       {"\n"}
// //                       {(d.recommendations || []).slice(0, 4).join("\n")}
// //                     </div>
// //                   )}
// //                   {(safeString(d.assignedTo).trim() || safeString(d.deadline).trim()) && (
// //                     <div className="wrap mini" style={{ marginTop: 6 }}>
// //                       <b>Assigned To:</b> {safeString(d.assignedTo || "—")}{" "}
// //                       <b>Deadline:</b> {safeString(d.deadline || "—")}
// //                     </div>
// //                   )}
// //                 </div>
// //               ))}
// //             </div>
// //           ) : (
// //             <div className="muted">No defects available.</div>
// //           )}
// //         </div>

// //         {/* Appendix / All Photos */}
// //         <div className="section page-break">
// //           <p className="h3">Appendix: All Photos</p>
// //           <p className="muted">Flat list of all images in inspection order.</p>

// //           {chunk(perImageNormalized, 4).map((pageItems, pi) => (
// //             <div key={pi} className="section">
// //               <div className="grid2">
// //                 {pageItems.map((it) => {
// //                   const imageUrl = safeString(it.__imageUrl || it.image_url || it.url);
// //                   const loc = safeString(it.__location || it.location || it.area).trim() || "Unspecified area";
// //                   const cond = effectiveConditionForPrint(it);
// //                   const comment = safeString(it.__comment || it.comment || it.comments);

// //                   return (
// //                     <div key={safeString(it.__sourceIndex)} className="card no-break">
// //                       <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
// //                         <span className={`badge ${normalizeCondition(cond)}`}>{normalizeCondition(cond).toUpperCase()}</span>
// //                         <span className="muted">#{Number(it.__sourceIndex) + 1}</span>
// //                       </div>
// //                       <div className="muted wrap" style={{ marginTop: 6 }}>
// //                         Location: <b>{loc}</b>
// //                       </div>
// //                       <div style={{ marginTop: 8 }}>
// //                         <img
// //                           className="img"
// //                           src={imageUrl}
// //                           alt={`appendix-${safeString(it.__sourceIndex)}`}
// //                           crossOrigin="anonymous"
// //                           referrerPolicy="no-referrer"
// //                           onError={(e) => {
// //                             e.currentTarget.style.display = "none";
// //                           }}
// //                         />
// //                       </div>
// //                       <div className="divider" />
// //                       <div className="wrap mini">{comment || "—"}</div>
// //                     </div>
// //                   );
// //                 })}
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Footer */}
// //       <div className="section muted" style={{ textAlign: "center" }}>
// //         Generated by iShip • {safeString(vessel.name || "Vessel")} • Model: {safeString(modelName || "—")}
// //       </div>
// //     </div>
// //   );
// // });

// // export default PrintReportV2;
