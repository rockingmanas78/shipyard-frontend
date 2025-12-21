// SummaryV2.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import { useReactToPrint } from "react-to-print";
import PrintReportV2 from "./PrintReportV2";

/** Safe JSON parse */
function safeJSONParse(jsonString, fallbackValue) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallbackValue;
  }
}

/** LocalStorage helpers */
const REPORT_META_STORAGE_KEY = "iship_report_meta_v1";
function readReportMetaFromLocalStorage() {
  const storedValue = localStorage.getItem(REPORT_META_STORAGE_KEY);
  const parsed = safeJSONParse(storedValue || "null", null);
  return parsed && typeof parsed === "object" ? parsed : null;
}
function writeReportMetaToLocalStorage(nextMeta) {
  localStorage.setItem(REPORT_META_STORAGE_KEY, JSON.stringify(nextMeta));
}

/** Inline icons */
const IconDoc = (props) => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
    <rect x="3" y="2" width="14" height="16" rx="2" fill="currentColor" fillOpacity="0.12" />
    <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="6" y="6" width="8" height="1.5" rx="0.75" fill="currentColor" />
    <rect x="6" y="9" width="8" height="1.5" rx="0.75" fill="currentColor" />
    <rect x="6" y="12" width="5" height="1.5" rx="0.75" fill="currentColor" />
  </svg>
);
const IconClipboard = (props) => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
    <rect x="5" y="3" width="10" height="14" rx="2" fill="currentColor" fillOpacity="0.12" />
    <rect x="5" y="3" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="8" y="2" width="4" height="3" rx="1" fill="currentColor" />
  </svg>
);
const IconUsers = (props) => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
    <circle cx="7" cy="8" r="3" fill="currentColor" fillOpacity="0.12" />
    <circle cx="13" cy="10" r="2" fill="currentColor" fillOpacity="0.12" />
    <circle cx="7" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="13" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M3 16c0-2.21 2.686-4 6-4s6 1.79 6 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
const IconAlert = (props) => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
    <circle cx="10" cy="10" r="8" fill="currentColor" fillOpacity="0.12" />
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="5" width="2" height="6" rx="1" fill="currentColor" />
    <rect x="9" y="13" width="2" height="2" rx="1" fill="currentColor" />
  </svg>
);
const IconCheck = (props) => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
    <circle cx="10" cy="10" r="8" fill="currentColor" fillOpacity="0.12" />
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 10.5l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const sectionAccent = {
  blue: "border-t-blue-500 bg-blue-50",
  cyan: "border-t-cyan-500 bg-cyan-50",
  violet: "border-t-violet-500 bg-violet-50",
  emerald: "border-t-emerald-500 bg-emerald-50",
  amber: "border-t-amber-500 bg-amber-50",
  rose: "border-t-rose-500 bg-rose-50",
  slate: "border-t-slate-500 bg-slate-50",
  default: "border-t-slate-300",
};
const iconAccent = {
  blue: "bg-blue-100 text-blue-600",
  cyan: "bg-cyan-100 text-cyan-600",
  violet: "bg-violet-100 text-violet-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  rose: "bg-rose-100 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
  default: "bg-slate-100 text-slate-600",
};

const SectionHeader = ({ id, title, subtitle, right, icon: Icon, accent = "default" }) => (
  <div
    id={id}
    className={`px-5 py-4 border-b border-t ${sectionAccent[accent] || sectionAccent.default} rounded-t-xl flex items-center justify-between`}
  >
    <div className="flex items-center gap-3">
      {Icon ? (
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${iconAccent[accent] || iconAccent.default}`}
        >
          <Icon className="w-5 h-5" />
        </span>
      ) : null}
      <div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>
    </div>
    {right}
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl border shadow-lg hover:shadow-xl transition bg-white ${className}`}>{children}</div>
);

const Input = ({ label, className = "", ...props }) => (
  <label className="block">
    <span className="text-xs font-medium text-gray-600">{label}</span>
    <input {...props} className={`mt-1 w-full border rounded-lg p-2 bg-white text-gray-900 placeholder-gray-400 ${className}`} />
  </label>
);

const TextArea = ({ label, rows = 4, className = "", ...props }) => (
  <label className="block">
    <span className="text-xs font-medium text-gray-600">{label}</span>
    <textarea
      rows={rows}
      {...props}
      className={`mt-1 w-full border rounded-lg p-2 bg-white text-gray-900 placeholder-gray-400 ${className}`}
    />
  </label>
);

const KeyMetric = ({ label, value, tone = "slate" }) => (
  <div className="rounded-xl border bg-white shadow-sm p-4">
    <div className="text-xs text-gray-500">{label}</div>
    <div
      className={`text-3xl font-semibold mt-1 ${
        tone === "red"
          ? "text-red-700"
          : tone === "amber"
          ? "text-amber-700"
          : tone === "green"
          ? "text-emerald-700"
          : tone === "blue"
          ? "text-blue-700"
          : "text-gray-900"
      }`}
    >
      {value}
    </div>
  </div>
);

const Tag = ({ value }) => {
  const labelMap = {
    fire_hazard: "Fire hazard",
    trip_fall: "Trip/Fall",
    none: "Satisfactory",
    rust: "Rust",
    attention: "Attention",
  };
  const color =
    value === "fire_hazard"
      ? "bg-red-50 text-red-700 border-red-200"
      : value === "trip_fall"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : value === "rust"
      ? "bg-orange-50 text-orange-800 border-orange-200"
      : value === "attention"
      ? "bg-sky-50 text-sky-800 border-sky-200"
      : "bg-emerald-50 text-emerald-800 border-emerald-200";
  return <span className={`text-xs px-2 py-1 rounded-full border ${color}`}>{labelMap[value] || value}</span>;
};

/**
 * Normalizers + Effective condition resolver
 * (kept compatible with your existing per_image contract)
 */
const getNormalizedCondition = (item) => ((item?.condition ?? item?.condition_type ?? "none") + "").toString();
const getNormalizedComment = (item) => ((item?.comment ?? item?.comments ?? "") + "").toString();

const getNormalizedRecommendationsArray = (item) => {
  if (Array.isArray(item?.recommendations_high_severity_only)) return item.recommendations_high_severity_only;
  if (Array.isArray(item?.recommendations)) return item.recommendations;
  if (typeof item?.recommendations_high_severity_only === "string") {
    return item.recommendations_high_severity_only
      .split(";")
      .map((segment) => segment.trim())
      .filter(Boolean);
  }
  return [];
};

const resolveEffectiveCondition = (perImageItem) => {
  const rawCondition = getNormalizedCondition(perImageItem);
  if (rawCondition !== "none") return rawCondition;

  const tagsObject = perImageItem?.tags || {};
  const hasRustStainsTag = Boolean(tagsObject?.rust_stains);

  const highSeverityRecommendationsArray = Array.isArray(perImageItem?.recommendations_high_severity_only)
    ? perImageItem.recommendations_high_severity_only
    : [];
  const hasHighSeverityRecommendations = highSeverityRecommendationsArray.length > 0;

  const fallbackRecommendationsArray = Array.isArray(perImageItem?.recommendations) ? perImageItem.recommendations : [];
  const hasAnyRecommendations = fallbackRecommendationsArray.length > 0;

  const severityLevel = (perImageItem?.severity_level || "").toString().toLowerCase();
  const priorityLevel = (perImageItem?.priority || "").toString().toLowerCase();
  const isHighOrExtremeSeverity = severityLevel === "high" || severityLevel === "extreme";
  const isImmediateOrCriticalPriority = priorityLevel === "immediate action required" || priorityLevel === "critical";

  if (hasRustStainsTag) return "rust";
  if (hasHighSeverityRecommendations || hasAnyRecommendations || isHighOrExtremeSeverity || isImmediateOrCriticalPriority) return "attention";
  return "none";
};

const conditionLabel = (value) => {
  const map = {
    fire_hazard: "Fire hazard",
    trip_fall: "Trip/Fall",
    none: "Satisfactory",
    rust: "Rust",
    attention: "Attention",
  };
  return map[value] || value || "—";
};

function defaultDistributionList() {
  return [
    { role: "Owner", name: "", email: "" },
    { role: "Manager", name: "", email: "" },
    { role: "Charterer", name: "", email: "" },
  ];
}

function defaultAbbreviationsText() {
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
    "SOPEP = Shipboard Oil Pollution Emergency Plan",
    "OWS = Oily Water Separator",
  ].join("\n");
}

function defaultDisclaimerText() {
  return (
    "This report is based on a visual inspection conducted at the stated time and location. " +
    "Findings reflect conditions observed at the time of inspection and are subject to change. " +
    "No dismantling, intrusive testing, or statutory verification was undertaken unless explicitly stated. " +
    "This report is provided for informational purposes only and should not be construed as a warranty or guarantee."
  );
}

function computeCommercialImpactText({ fireCount, tripCount, rustCount, attentionCount }) {
  const totalIssues = (fireCount || 0) + (tripCount || 0) + (rustCount || 0) + (attentionCount || 0);
  if (totalIssues === 0) {
    return "No critical/high impact findings were identified in the sampled set. Continue routine inspections and preventive maintenance, and close out minor observations through standard planned maintenance.";
  }
  if ((fireCount || 0) > 0) {
    return "Fire hazards can increase operational risk and may impact compliance outcomes if not addressed. Immediate corrective actions are recommended for any fire-related findings, including housekeeping improvements, removal of ignition sources, and verification of firefighting readiness.";
  }
  if ((tripCount || 0) > 0) {
    return "Trip/fall hazards may lead to crew injury and lost time incidents, increasing operational disruption and liability exposure. Prioritize housekeeping, route clearance, and signage where applicable.";
  }
  if ((attentionCount || 0) > 0) {
    return "Items marked 'Attention' may increase maintenance cost and reduce operational efficiency if left unaddressed. Prioritize corrective actions in the next maintenance window and monitor for recurrence.";
  }
  if ((rustCount || 0) > 0) {
    return "Rust/corrosion findings typically increase maintenance scope and may reduce equipment life. Schedule surface preparation, coating renewal, and follow-up inspections to prevent progression.";
  }
  return "Findings require routine follow-up. Close out corrective actions with evidence (photos, checklists, logs) and verify during subsequent inspections.";
}

export default function SummaryV2({ model = "openai" }) {
  // ---- baseURL image helper
  const imageURLFromId = (id) => `${api.defaults.baseURL}/uploads/${encodeURIComponent(id)}`;

  // ---- load localStorage safely
  const [storageVersion, setStorageVersion] = useState(0);

  const results = useMemo(() => {
    const stored = safeJSONParse(localStorage.getItem("iship_results") || "{}", {});
    const modelBucket = stored?.results?.[model] || {};
    return modelBucket && typeof modelBucket === "object" ? modelBucket : {};
  }, [model, storageVersion]);

  const perImage = Array.isArray(results?.per_image) ? results.per_image : [];
  const counts = results?.batch_summary || { fire_hazard_count: 0, trip_fall_count: 0, none_count: 0 };

  // ---- meta (extended, but keeps existing fields unchanged)
  const [meta, setMeta] = useState(() => {
    const storedMeta = readReportMetaFromLocalStorage();

    const baseMeta = {
      // existing
      date: new Date().toISOString().slice(0, 10),
      vesselName: "",
      imo: "",
      flag: "",
      callSign: "",
      location: "",
      inspector: "",
      reportRef: "",
      weather: "",
      scope: "General safety walk-through of accessible areas; visual-only.",
      methodology: "Visual inspection, photo tagging via computer vision, rule-based hazard checks.",
      limitations: "No confined space entry; no dismantling of machinery; weather & access permitting.",
      overallRating: "Satisfactory",
      score: null,
      summaryBlurb:
        "The vessel presents generally good housekeeping. One fire hazard was identified near machinery due to oil residue. No trip/fall issues were found in sampled areas.",

      // crew fields already used in UI
      crewTotal: "",
      officers: "",
      ratings: "",

      // NEW: required sections (for UI + PrintReport props; PrintReport can choose to use them later)
      disclaimerText: defaultDisclaimerText(),
      distributionList: defaultDistributionList(),
      termsText:
        "Observation: A recorded condition noted during inspection (may or may not require action).\n" +
        "Defect / Non-conformity: A condition requiring attention or corrective action.\n" +
        "Severity: Indicative impact level (low/medium/high/critical).\n" +
        "Priority: Urgency for action (low/medium/high/critical).",
      abbreviationsText: defaultAbbreviationsText(),
      referencesText: "",

      // Vessel particulars (more complete)
      vesselType: "",
      vesselClass: "",
      vesselDWT: "",
      vesselGT: "",
      vesselLOA: "",
      vesselBeam: "",
      vesselYearBuilt: "",
      vesselPortOfRegistry: "",

      // Inspector particulars (more complete)
      inspectorCompany: "",
      inspectorEmail: "",
      inspectorPhone: "",
      inspectorCredentials: "",

      // Vessel movement
      lastPort: "",
      currentPort: "",
      nextPort: "",
      eta: "",
      etd: "",
      berthOrAnchorage: "",
      voyageNotes: "",
    };

    if (!storedMeta) return baseMeta;
    return { ...baseMeta, ...storedMeta };
  });

  // persist meta (so it survives reload)
  useEffect(() => {
    writeReportMetaToLocalStorage(meta);
  }, [meta]);

  // ---- section scorecard
  const [areaRatings, setAreaRatings] = useState({
    Accommodation: { score: 90, rating: "Excellent", remarks: "" },
    Bridge: { score: 85, rating: "Good", remarks: "" },
    "Engine Room": { score: 80, rating: "Good", remarks: "" },
    "Hull Area": { score: 70, rating: "Satisfactory", remarks: "" },
    "Cargo Control Room": { score: 75, rating: "Satisfactory", remarks: "" },
  });

  const avgScore = useMemo(() => {
    const vals = Object.values(areaRatings || {});
    if (!vals.length) return "0";
    const n = vals.reduce((sum, a) => sum + (Number(a?.score) || 0), 0) / vals.length;
    return n.toFixed(1);
  }, [areaRatings]);

  // ---- observations
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [obsView, setObsView] = useState("grid");
  const [obsFilterCond, setObsFilterCond] = useState("");
  const [obsSearch, setObsSearch] = useState("");
  const [obsSort, setObsSort] = useState({ key: "index", dir: "asc" });

  const obsRows = useMemo(() => {
    return perImage.map((it, i) => {
      const text = [it.id, it.location, getNormalizedComment(it)].filter(Boolean).join(" ").toLowerCase();
      return {
        raw: it,
        index: i + 1,
        sourceIndex: i, // IMPORTANT for persistence
        id: it.id,
        location: it.location || "",
        condition: resolveEffectiveCondition(it),
        text,
      };
    });
  }, [perImage]);

  const obsFilteredSorted = useMemo(() => {
    let list = obsRows;

    if (obsFilterCond) list = list.filter((r) => r.condition === obsFilterCond);
    if (obsSearch.trim()) {
      const query = obsSearch.trim().toLowerCase();
      list = list.filter((r) => r.text.includes(query));
    }

    const { key, dir } = obsSort;
    const mul = dir === "desc" ? -1 : 1;
    list = [...list].sort((a, b) => {
      const av = a[key] ?? "";
      const bv = b[key] ?? "";
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * mul;
    });

    return list;
  }, [obsRows, obsFilterCond, obsSearch, obsSort]);

  // ---- persist row comment / recs into localStorage under SAME model bucket
  const persistRow = (rowIndex, updater) => {
    const copy = safeJSONParse(localStorage.getItem("iship_results") || "{}", {});
    if (!copy.results) copy.results = {};
    if (!copy.results[model]) copy.results[model] = {};
    const list = Array.isArray(copy.results[model].per_image) ? copy.results[model].per_image : [];
    if (!list[rowIndex]) return;

    const next = { ...list[rowIndex], ...updater };
    if (typeof next.recommendations_high_severity_only === "string") {
      next.recommendations_high_severity_only = next.recommendations_high_severity_only
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    list[rowIndex] = next;
    copy.results[model].per_image = list;
    localStorage.setItem("iship_results", JSON.stringify(copy));
    setStorageVersion((v) => v + 1);
  };

  // ---- defects (manual + overrides)
  const DEFECTS_KEY = "iship_defects_v1";
  const [defects, setDefects] = useState(() => safeJSONParse(localStorage.getItem(DEFECTS_KEY) || "{}", {}));
  const getDefect = (id) => defects[id] || {};
  const updateDefect = (id, patch) => {
    setDefects((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      localStorage.setItem(DEFECTS_KEY, JSON.stringify(next));
      return next;
    });
  };
  const deleteDefect = (id, isManual) => {
    setDefects((prev) => {
      const next = { ...prev };
      if (isManual) delete next[id];
      else next[id] = { ...(next[id] || {}), hidden: true };
      localStorage.setItem(DEFECTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const hazardRowsDerived = useMemo(() => {
    const derived = perImage
      .map((it, i) => {
        const effectiveCondition = resolveEffectiveCondition(it);
        const recommendationsArray = getNormalizedRecommendationsArray(it);
        const hasRecommendations = recommendationsArray.length > 0;

        if (effectiveCondition === "none" && !hasRecommendations) return null;

        const overrides = getDefect(it.id);
        if (overrides?.hidden) return null;

        return {
          id: it.id,
          photoId: it.id,
          index: i + 1,
          area: it.location || "—",
          condition: effectiveCondition,
          comment: getNormalizedComment(it),
          recommendations: recommendationsArray.join("; ") || "",
          assignedTo: "",
          deadline: "",
          manual: false,
          ...overrides,
        };
      })
      .filter(Boolean);

    const manual = Object.values(defects)
      .filter((d) => d && d.manual && !d.hidden)
      .map((d, j) => ({
        id: d.id,
        index: derived.length + j + 1,
        area: d.area || "—",
        condition: d.condition || "attention",
        combined: d.combined || "",
        assignedTo: d.assignedTo || "",
        deadline: d.deadline || "",
        photoId: d.photoId || "",
        manual: true,
      }));

    return [...derived, ...manual];
  }, [perImage, defects]);

  const countsDerived = useMemo(() => {
    const fire = hazardRowsDerived.filter((r) => r.condition === "fire_hazard").length;
    const trip = hazardRowsDerived.filter((r) => r.condition === "trip_fall").length;
    const rust = hazardRowsDerived.filter((r) => r.condition === "rust").length;
    const attention = hazardRowsDerived.filter((r) => r.condition === "attention").length;
    const missingTs = perImage.filter((it) => !(it.timestamp || it.capture_time || it?.exif?.DateTimeOriginal)).length;
    return { fire, trip, rust, attention, missingTs };
  }, [hazardRowsDerived, perImage]);

  const [editFindings, setEditFindings] = useState(false);
  const [findings, setFindings] = useState({ fire: 0, trip: 0, rust: 0, attention: 0, missingTs: 0 });

  useEffect(() => {
    setFindings({
      fire: countsDerived.fire,
      trip: countsDerived.trip,
      rust: countsDerived.rust,
      attention: countsDerived.attention,
      missingTs: countsDerived.missingTs,
    });
  }, [countsDerived]);

  // ---- add defect modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    photoId: "",
    area: "",
    assignedTo: "",
    condition: "attention",
    combined: "",
    deadline: "",
  });

  const onSaveAdd = () => {
    const key = `manual-${Date.now()}`;
    const entry = {
      id: key,
      photoId: addForm.photoId?.trim() || "",
      area: addForm.area || "—",
      assignedTo: addForm.assignedTo || "",
      condition: addForm.condition || "attention",
      combined: addForm.combined || "",
      deadline: addForm.deadline || "",
      manual: true,
    };
    setDefects((prev) => {
      const next = { ...prev, [key]: entry };
      localStorage.setItem(DEFECTS_KEY, JSON.stringify(next));
      return next;
    });
    setAddOpen(false);
    setAddForm({ photoId: "", area: "", assignedTo: "", condition: "attention", combined: "", deadline: "" });
  };

  // ---- AI summary generation
  const [genBusy, setGenBusy] = useState(false);

  const buildSummaryPayload = () => {
    const hazards = perImage.map((it) => ({
      id: it.id,
      location: it.location || "",
      condition: resolveEffectiveCondition(it),
      tags: it.tags || {},
      comment: getNormalizedComment(it),
      recs: getNormalizedRecommendationsArray(it).join("; "),
    }));
    return {
      meta: {
        vesselName: meta.vesselName,
        date: meta.date,
        location: meta.location,
        inspector: meta.inspector,
      },
      counts: results?.batch_summary || {},
      hazards,
    };
  };

  const localHeuristicSummary = () => {
    const c = results?.batch_summary || { fire_hazard_count: 0, trip_fall_count: 0, none_count: 0 };
    const locCounts = {};
    perImage.forEach((it) => {
      const key = it.location || "unspecified area";
      locCounts[key] = (locCounts[key] || 0) + 1;
    });
    const topLocs = Object.entries(locCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k]) => k)
      .join(" & ");
    const parts = [];
    parts.push(
      `The inspection on ${meta.date || "the stated date"} at ${meta.location || "the reported location"} covered ${
        perImage.length
      } photos across ${Object.keys(locCounts).length} area(s).`
    );
    if (c.fire_hazard_count) parts.push(`${c.fire_hazard_count} fire hazard(s) were flagged.`);
    if (c.trip_fall_count) parts.push(`${c.trip_fall_count} trip/fall issue(s) noted.`);
    if (!c.fire_hazard_count && !c.trip_fall_count) parts.push("No critical hazards were detected in the sampled set.");
    parts.push(`Most photos came from ${topLocs || "varied areas"}.`);
    return parts.join(" ");
  };

  const generateSummary = async () => {
    setGenBusy(true);
    try {
      const payload = buildSummaryPayload();
      let text = "";
      try {
        const { data } = await api.post("/api/summarize", payload);
        text = data?.summary || "";
        if (data?.overallRating) setMeta((m) => ({ ...m, overallRating: data.overallRating }));
        if (typeof data?.score === "number") {
          const scoreNumber = Math.max(0, Math.min(100, Math.round(data.score)));
          setMeta((m) => ({ ...m, score: scoreNumber }));
        }
      } catch {
        text = localHeuristicSummary();
        const c = results?.batch_summary || { fire_hazard_count: 0, trip_fall_count: 0, none_count: 0 };
        const total = (c.fire_hazard_count || 0) + (c.trip_fall_count || 0);
        const scoreNumber = Math.max(0, 100 - total * 10);
        const rating =
          scoreNumber >= 90 ? "Excellent" : scoreNumber >= 75 ? "Good" : scoreNumber >= 60 ? "Satisfactory" : scoreNumber >= 40 ? "Fair" : "Poor";
        setMeta((m) => ({ ...m, overallRating: rating, score: scoreNumber }));
      }
      setMeta((m) => ({ ...m, summaryBlurb: text || m.summaryBlurb }));
    } finally {
      setGenBusy(false);
    }
  };

  useEffect(() => {
    const t = (meta.summaryBlurb || "").trim();
    if (!t || t.length < 20) generateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- PRINT / PDF
  const printRef = useRef(null);

  const waitForImages = async (rootEl) => {
    if (!rootEl) return;
    const imageElements = Array.from(rootEl.querySelectorAll("img"));
    await Promise.all(
      imageElements.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );
  };

  const triggerPrint = useReactToPrint({
    contentRef: printRef,
    content: () => printRef.current,
    documentTitle: `${(meta?.vesselName || "Vessel").toString().trim() || "Vessel"}_Inspection_Report`,
    removeAfterPrint: false,
    onBeforeGetContent: async () => {
      if (printRef.current) await waitForImages(printRef.current);
    },
    onBeforePrint: async () => {
      if (printRef.current) await waitForImages(printRef.current);
    },
    onPrintError: (err) => {
      // eslint-disable-next-line no-console
      console.error("Print error:", err);
      alert("PDF export failed. Open Console for details.");
    },
  });

  const onDownloadPDF = () => {
    if (!printRef.current) {
      // eslint-disable-next-line no-console
      console.error("Print node ref is null. Ensure PrintReport uses forwardRef and attaches ref to a DOM element.");
      alert("PDF export not ready: printable report is not mounted. Please ensure PrintReport uses forwardRef.");
      return;
    }
    if (typeof triggerPrint === "function") {
      triggerPrint();
      return;
    }
    window.print();
  };

  // ---- Photo Gallery (UI only): group photos by location
  const photoGalleryGroups = useMemo(() => {
    const groupsMap = new Map();
    perImage.forEach((imageItem) => {
      const locationValue = (imageItem.location || "").toString().trim() || "Unspecified area";
      const arr = groupsMap.get(locationValue) || [];
      arr.push(imageItem);
      groupsMap.set(locationValue, arr);
    });
    return Array.from(groupsMap.entries())
      .map(([locationName, items]) => ({ locationName, items }))
      .sort((a, b) => a.locationName.localeCompare(b.locationName));
  }, [perImage]);

  const commercialImpactText = useMemo(() => {
    return computeCommercialImpactText({
      fireCount: findings.fire,
      tripCount: findings.trip,
      rustCount: findings.rust,
      attentionCount: findings.attention,
    });
  }, [findings.fire, findings.trip, findings.rust, findings.attention]);

  // ---- PATCH (PRINTREPORTV2): reportMeta + analysis
  const reportMetaForPrint = useMemo(() => {
    const abbreviationsCustom = (meta.abbreviationsText || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const references = (meta.referencesText || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      disclaimer: meta.disclaimerText || "",
      distribution: Array.isArray(meta.distributionList) ? meta.distributionList : [],
      abbreviationsCustom,
      references,

      vessel: {
        name: meta.vesselName || "",
        imo: meta.imo || "",
        flag: meta.flag || "",
        callSign: meta.callSign || "",
        type: meta.vesselType || "",
        class: meta.vesselClass || "",
        dwt: meta.vesselDWT || "",
        gt: meta.vesselGT || "",
        loa: meta.vesselLOA || "",
        beam: meta.vesselBeam || "",
        yearBuilt: meta.vesselYearBuilt || "",
        portOfRegistry: meta.vesselPortOfRegistry || "",
      },

      inspector: {
        name: meta.inspector || "",
        company: meta.inspectorCompany || "",
        email: meta.inspectorEmail || "",
        phone: meta.inspectorPhone || "",
        credentials: meta.inspectorCredentials || "",
        inspectionDate: meta.date || "",
        inspectionLocation: meta.location || "",
      },

      vesselMovement: {
        lastPort: meta.lastPort || "",
        currentPort: meta.currentPort || "",
        nextPort: meta.nextPort || "",
        eta: meta.eta || "",
        etd: meta.etd || "",
        berthOrAnchorage: meta.berthOrAnchorage || "",
        voyageNotes: meta.voyageNotes || "",
      },

      crew: {
        total: meta.crewTotal || "",
        officers: meta.officers || "",
        ratings: meta.ratings || "",
        nationalities: meta.nationalities || "",
        keyOfficers: meta.keyOfficers || "",
      },

      executiveSummary: {
        useManual: true,
        text: meta.summaryBlurb || "",
      },
    };
  }, [meta]);

  const analysisForPrint = useMemo(() => {
    const perImageList = Array.isArray(perImage) ? perImage : [];
    const perImageNormalized = perImageList.map((it, idx) => ({
      ...it,
      __sourceIndex: idx,
      __imageUrl: imageURLFromId(it.id),
      __location: it.location || it.area || "",
      __condition: it.condition || it.condition_type || "none",
      __severity: it.severity_level || it.severity || "",
      __priority: it.priority || "",
      __comment: it.comment || it.comments || "",
      __recommendations: getNormalizedRecommendationsArray(it),
    }));

    const defectsVisible = Array.isArray(hazardRowsDerived)
      ? hazardRowsDerived.map((row, i) => {
          const pid = row.photoId || row.rawId || row.id;
          const recs =
            Array.isArray(row.recommendations)
              ? row.recommendations
              : (row.recommendations || "")
                  .toString()
                  .split(";")
                  .map((s) => s.trim())
                  .filter(Boolean);

          const manualText = (row.combined || "").toString().trim();
          const manualRecs = manualText
            ? manualText
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

          return {
            ...row,
            id: row.id || pid || `def-${i}`,
            isDerived: Boolean(row.isDerived ?? (!row.manual)),
            imageUrl: row.imageUrl || (pid ? imageURLFromId(pid) : ""),
            location: row.location || row.area || "",
            severity: row.severity_level || row.severity || "",
            priority: row.priority || "",
            comment: (row.comment || (row.manual ? row.combined : "") || "").toString(),
            recommendations: row.manual ? manualRecs : recs,
          };
        })
      : [];

    return { avgScore, perImageNormalized, defectsVisible };
  }, [perImage, hazardRowsDerived, avgScore]);

  // ---- If no data, show message (not blank)
  if (!perImage.length) {
    return (
      <div className="max-w-6xl mx-auto py-10 text-gray-700">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-lg font-semibold">No results yet</div>
          <div className="mt-2 text-sm text-gray-600">
            Please upload and analyze photos first (ensure <b>iship_results</b> exists in localStorage).
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-0 pb-6 print:py-0">
      {/* Off-screen printable node */}
      <div style={{ position: "absolute", left: "-10000px", top: 0, width: "794px", padding: "24px", background: "white" }} aria-hidden="true">
        <PrintReportV2
          ref={printRef}
          reportMeta={reportMetaForPrint}
          analysis={analysisForPrint}
          modelName={model}
        />
      </div>

      {/* INDEX (new, minimal UI addition) */}
      <Card className="mb-6 border-t-2 border-slate-500">
        <SectionHeader
          id="index"
          title="Index"
          subtitle="Quick navigation to sections."
          icon={IconDoc}
          accent="slate"
          right={
            <div className="flex gap-2 no-print">
              <button
                onClick={onDownloadPDF}
                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                title="Opens print dialog → choose Save as PDF"
              >
                Download PDF
              </button>
            </div>
          }
        />
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {[
              { label: "Cover", href: "#cover" },
              { label: "Disclaimer", href: "#disclaimer" },
              { label: "Distribution list", href: "#distribution" },
              { label: "Terms & abbreviations", href: "#terms" },
              { label: "References", href: "#references" },
              { label: "Vessel movement", href: "#movement" },
              { label: "Executive summary", href: "#executive" },
              { label: "Overall rating", href: "#overallRating" },
              { label: "Findings & impact", href: "#findingsImpact" },
              { label: "Scorecard", href: "#scorecard" },
              { label: "Observations", href: "#observations" },
              { label: "Defects", href: "#defects" },
              { label: "Photo gallery", href: "#photoGallery" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-800"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </Card>

      {/* COVER (kept same) */}
      <Card className="mb-6 border-t-2 border-blue-500">
        <SectionHeader
          id="cover"
          title="Vessel Inspection Report"
          subtitle="Generated by iShip Inspection AI — review, edit, and export."
          icon={IconDoc}
          accent="blue"
          right={
            <div className="flex gap-2 no-print">
              <button
                onClick={onDownloadPDF}
                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                title="Opens print dialog → choose Save as PDF"
              >
                Download PDF
              </button>
            </div>
          }
        />
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Vessel name" value={meta.vesselName} onChange={(e) => setMeta({ ...meta, vesselName: e.target.value })} />
          <label className="block">
            <span className="text-xs font-medium text-gray-600">Report reference</span>
            <select
              className="mt-1 w-full border rounded-lg p-2 bg-white text-gray-900"
              value={meta.reportRef}
              onChange={(e) => setMeta({ ...meta, reportRef: e.target.value })}
            >
              <option value="">Select report type…</option>
              <option value="Superintendent Routine Audit">Superintendent Routine Audit</option>
              <option value="Internal Audit">Internal Audit</option>
              <option value="External Audit">External Audit</option>
              <option value="Follow-up Inspection">Follow-up Inspection</option>
              <option value="Pre-Purchase">Pre-Purchase</option>
              <option value="Vessel Takeover Inspection">Vessel Takeover Inspection</option>
              <option value="PSC">PSC</option>
              <option value="Vessel Takeover">Vessel Takeover</option>
            </select>
          </label>

          <Input label="Inspection date" type="date" value={meta.date} onChange={(e) => setMeta({ ...meta, date: e.target.value })} />
          <Input label="Location / Port" value={meta.location} onChange={(e) => setMeta({ ...meta, location: e.target.value })} />
          <Input label="Inspector (name)" value={meta.inspector} onChange={(e) => setMeta({ ...meta, inspector: e.target.value })} />
          <Input label="Weather" value={meta.weather} onChange={(e) => setMeta({ ...meta, weather: e.target.value })} />

          <Input label="IMO" value={meta.imo} onChange={(e) => setMeta({ ...meta, imo: e.target.value })} />
          <Input label="Flag" value={meta.flag} onChange={(e) => setMeta({ ...meta, flag: e.target.value })} />
          <Input label="Call sign" value={meta.callSign} onChange={(e) => setMeta({ ...meta, callSign: e.target.value })} />

          {/* NEW: vessel particulars (added, but kept in same cover card) */}
          <Input label="Vessel type" value={meta.vesselType || ""} onChange={(e) => setMeta({ ...meta, vesselType: e.target.value })} />
          <Input label="Class" value={meta.vesselClass || ""} onChange={(e) => setMeta({ ...meta, vesselClass: e.target.value })} />
          <Input label="DWT" value={meta.vesselDWT || ""} onChange={(e) => setMeta({ ...meta, vesselDWT: e.target.value })} />
          <Input label="GT" value={meta.vesselGT || ""} onChange={(e) => setMeta({ ...meta, vesselGT: e.target.value })} />
          <Input label="LOA" value={meta.vesselLOA || ""} onChange={(e) => setMeta({ ...meta, vesselLOA: e.target.value })} />
          <Input label="Beam" value={meta.vesselBeam || ""} onChange={(e) => setMeta({ ...meta, vesselBeam: e.target.value })} />
          <Input label="Year built" value={meta.vesselYearBuilt || ""} onChange={(e) => setMeta({ ...meta, vesselYearBuilt: e.target.value })} />
          <Input
            label="Port of registry"
            value={meta.vesselPortOfRegistry || ""}
            onChange={(e) => setMeta({ ...meta, vesselPortOfRegistry: e.target.value })}
          />

          {/* NEW: inspector particulars */}
          <Input
            label="Inspector company"
            value={meta.inspectorCompany || ""}
            onChange={(e) => setMeta({ ...meta, inspectorCompany: e.target.value })}
          />
          <Input
            label="Inspector email"
            value={meta.inspectorEmail || ""}
            onChange={(e) => setMeta({ ...meta, inspectorEmail: e.target.value })}
          />
          <Input
            label="Inspector phone"
            value={meta.inspectorPhone || ""}
            onChange={(e) => setMeta({ ...meta, inspectorPhone: e.target.value })}
          />
          <Input
            label="Inspector credentials"
            value={meta.inspectorCredentials || ""}
            onChange={(e) => setMeta({ ...meta, inspectorCredentials: e.target.value })}
          />
        </div>
      </Card>

      {/* DISCLAIMER (new) */}
      <Card className="mb-6 border-t-2 border-slate-500">
        <SectionHeader id="disclaimer" title="Disclaimer" subtitle="Standard disclaimer for the report." icon={IconAlert} accent="slate" />
        <div className="p-5">
          <TextArea
            label="Disclaimer text"
            rows={5}
            value={meta.disclaimerText || ""}
            onChange={(e) => setMeta({ ...meta, disclaimerText: e.target.value })}
          />
        </div>
      </Card>

      {/* DISTRIBUTION LIST (new) */}
      <Card className="mb-6 border-t-2 border-slate-500">
        <SectionHeader id="distribution" title="Distribution list" subtitle="Who will receive this report." icon={IconUsers} accent="slate" />
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(meta.distributionList) ? meta.distributionList : []).map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-3 py-2">
                      <input
                        className="w-full border rounded-lg p-2 bg-white"
                        value={row.role || ""}
                        onChange={(e) => {
                          const next = [...meta.distributionList];
                          next[index] = { ...next[index], role: e.target.value };
                          setMeta({ ...meta, distributionList: next });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full border rounded-lg p-2 bg-white"
                        value={row.name || ""}
                        onChange={(e) => {
                          const next = [...meta.distributionList];
                          next[index] = { ...next[index], name: e.target.value };
                          setMeta({ ...meta, distributionList: next });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full border rounded-lg p-2 bg-white"
                        value={row.email || ""}
                        onChange={(e) => {
                          const next = [...meta.distributionList];
                          next[index] = { ...next[index], email: e.target.value };
                          setMeta({ ...meta, distributionList: next });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-xs px-3 py-1 rounded-lg border text-red-700 hover:bg-red-50"
                        onClick={() => {
                          const next = [...meta.distributionList];
                          next.splice(index, 1);
                          setMeta({ ...meta, distributionList: next });
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-gray-50">
                  <td className="px-3 py-2" colSpan={4}>
                    <button
                      type="button"
                      className="text-xs px-3 py-2 rounded-lg border hover:bg-white"
                      onClick={() => {
                        const next = Array.isArray(meta.distributionList) ? [...meta.distributionList] : [];
                        next.push({ role: "", name: "", email: "" });
                        setMeta({ ...meta, distributionList: next });
                      }}
                    >
                      + Add recipient
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">Tip: keep emails optional if you don’t want them printed.</p>
        </div>
      </Card>

      {/* TERMS & ABBREVIATIONS (new) */}
      <Card className="mb-6 border-t-2 border-slate-500">
        <SectionHeader id="terms" title="Terms & abbreviations" subtitle="Terms definitions + common abbreviations." icon={IconClipboard} accent="slate" />
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextArea
            label="Terms"
            rows={7}
            value={meta.termsText || ""}
            onChange={(e) => setMeta({ ...meta, termsText: e.target.value })}
          />
          <TextArea
            label="Abbreviations (one per line)"
            rows={7}
            value={meta.abbreviationsText || ""}
            onChange={(e) => setMeta({ ...meta, abbreviationsText: e.target.value })}
          />
        </div>
      </Card>

      {/* REFERENCES (new) */}
      <Card className="mb-6 border-t-2 border-slate-500">
        <SectionHeader id="references" title="References" subtitle="List any relevant references / standards (one per line)." icon={IconDoc} accent="slate" />
        <div className="p-5">
          <TextArea
            label="References"
            rows={5}
            value={meta.referencesText || ""}
            onChange={(e) => setMeta({ ...meta, referencesText: e.target.value })}
          />
        </div>
      </Card>

      {/* VESSEL MOVEMENT (new) */}
      <Card className="mb-6 border-t-2 border-violet-500">
        <SectionHeader id="movement" title="Vessel movement" subtitle="Movement & voyage details." icon={IconDoc} accent="violet" />
        <div className="p-5 grid md:grid-cols-2 gap-4">
          <Input label="Last port" value={meta.lastPort || ""} onChange={(e) => setMeta({ ...meta, lastPort: e.target.value })} />
          <Input label="Current port" value={meta.currentPort || ""} onChange={(e) => setMeta({ ...meta, currentPort: e.target.value })} />
          <Input label="Next port" value={meta.nextPort || ""} onChange={(e) => setMeta({ ...meta, nextPort: e.target.value })} />
          <Input label="Berth / Anchorage" value={meta.berthOrAnchorage || ""} onChange={(e) => setMeta({ ...meta, berthOrAnchorage: e.target.value })} />
          <Input label="ETA" value={meta.eta || ""} onChange={(e) => setMeta({ ...meta, eta: e.target.value })} />
          <Input label="ETD" value={meta.etd || ""} onChange={(e) => setMeta({ ...meta, etd: e.target.value })} />
          <div className="md:col-span-2">
            <TextArea label="Voyage notes" rows={3} value={meta.voyageNotes || ""} onChange={(e) => setMeta({ ...meta, voyageNotes: e.target.value })} />
          </div>
        </div>
      </Card>

      {/* EXECUTIVE SUMMARY (kept same) */}
      <Card className="mb-6 border-t-2 border-blue-500">
        <SectionHeader
          id="executive"
          title="Executive summary"
          subtitle="One-paragraph overview for busy readers."
          icon={IconDoc}
          accent="blue"
          right={
            <button
              onClick={generateSummary}
              disabled={genBusy}
              className="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 disabled:opacity-50 no-print"
              title="Auto-generate from findings"
            >
              {genBusy ? "Generating…" : "Auto-generate"}
            </button>
          }
        />
        <div className="p-5">
          <div className="grid md:grid-cols-3 gap-4">
            <KeyMetric label="Fire hazards" value={counts.fire_hazard_count ?? 0} tone={(counts.fire_hazard_count ?? 0) > 0 ? "red" : "green"} />
            <KeyMetric label="Trip / fall" value={counts.trip_fall_count ?? 0} tone={(counts.trip_fall_count ?? 0) > 0 ? "amber" : "green"} />
            <KeyMetric label="Satisfactory" value={counts.none_count ?? 0} tone="green" />
          </div>

          <TextArea
            label="Summary"
            className="mt-4"
            rows={4}
            value={meta.summaryBlurb}
            onChange={(e) => setMeta({ ...meta, summaryBlurb: e.target.value })}
          />

          <div id="overallRating" className="mt-4 p-4 rounded-lg border bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600">Overall Rating</p>
                <p className="text-lg font-semibold text-gray-900">{meta.overallRating || "—"}</p>
                {meta.score !== null ? <p className="text-sm text-gray-500">Score: {meta.score} / 100</p> : null}
              </div>
              <div className="flex flex-col text-xs text-gray-600">
                <span className="mb-1">Adjust manually:</span>
                <select
                  value={meta.overallRating}
                  onChange={(e) => setMeta({ ...meta, overallRating: e.target.value })}
                  className="border rounded p-1 bg-white text-gray-900"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Satisfactory">Satisfactory</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* INSPECTION DETAILS (kept same) */}
      <Card className="mb-6 border-t-2 border-cyan-500">
        <SectionHeader id="details" title="Inspection details" icon={IconClipboard} accent="cyan" />
        <div className="p-5 grid md:grid-cols-2 gap-4">
          <TextArea label="Scope" rows={3} value={meta.scope} onChange={(e) => setMeta({ ...meta, scope: e.target.value })} />
          <TextArea label="Methodology" rows={3} value={meta.methodology} onChange={(e) => setMeta({ ...meta, methodology: e.target.value })} />
          <TextArea label="Limitations" rows={3} value={meta.limitations} onChange={(e) => setMeta({ ...meta, limitations: e.target.value })} />
        </div>
      </Card>

      {/* CREW (kept same) */}
      <Card className="mb-6 border-t-2 border-emerald-500">
        <SectionHeader id="crew" title="Crew & manning" icon={IconUsers} accent="emerald" />
        <div className="p-5 grid md:grid-cols-3 gap-4">
          <Input label="Total crew" value={meta.crewTotal || ""} onChange={(e) => setMeta({ ...meta, crewTotal: e.target.value })} />
          <Input label="Officers" value={meta.officers || ""} onChange={(e) => setMeta({ ...meta, officers: e.target.value })} />
          <Input label="Ratings" value={meta.ratings || ""} onChange={(e) => setMeta({ ...meta, ratings: e.target.value })} />
        </div>
      </Card>

      {/* FINDINGS AT A GLANCE (kept same) */}
      <Card className="mb-6 border-t-2 border-amber-500">
        <SectionHeader
          id="kpis"
          title="Findings at a glance"
          icon={IconAlert}
          accent="amber"
          right={
            <button onClick={() => setEditFindings((e) => !e)} className="px-3 py-1 rounded-lg border text-gray-700 hover:bg-gray-50">
              {editFindings ? "Done" : "Edit"}
            </button>
          }
        />
        <div className="p-5 grid md:grid-cols-5 gap-4">
          {!editFindings ? (
            <>
              <KeyMetric label="Fire hazards" value={findings.fire} tone={findings.fire ? "red" : "green"} />
              <KeyMetric label="Trip / fall" value={findings.trip} tone={findings.trip ? "amber" : "green"} />
              <KeyMetric label="Rust" value={findings.rust} tone={findings.rust ? "amber" : "green"} />
              <KeyMetric label="Attention" value={findings.attention} tone={findings.attention ? "blue" : "green"} />
              <KeyMetric label="Missing timestamps" value={findings.missingTs} tone={findings.missingTs ? "violet" : "green"} />
            </>
          ) : (
            <>
              <Input label="Fire hazards" type="number" value={findings.fire} onChange={(e) => setFindings((f) => ({ ...f, fire: Number(e.target.value || 0) }))} />
              <Input label="Trip / fall" type="number" value={findings.trip} onChange={(e) => setFindings((f) => ({ ...f, trip: Number(e.target.value || 0) }))} />
              <Input label="Rust" type="number" value={findings.rust} onChange={(e) => setFindings((f) => ({ ...f, rust: Number(e.target.value || 0) }))} />
              <Input label="Attention" type="number" value={findings.attention} onChange={(e) => setFindings((f) => ({ ...f, attention: Number(e.target.value || 0) }))} />
              <Input label="Missing timestamps" type="number" value={findings.missingTs} onChange={(e) => setFindings((f) => ({ ...f, missingTs: Number(e.target.value || 0) }))} />
            </>
          )}
        </div>
      </Card>

      {/* SUMMARY OF FINDINGS & COMMERCIAL IMPACT (new) */}
      <Card className="mb-6 border-t-2 border-amber-500">
        <SectionHeader
          id="findingsImpact"
          title="Summary of findings & commercial impact"
          subtitle="Short narrative summary for stakeholders."
          icon={IconAlert}
          accent="amber"
        />
        <div className="p-5">
          <TextArea
            label="Commercial impact (editable)"
            rows={4}
            value={meta.commercialImpactText || commercialImpactText}
            onChange={(e) => setMeta({ ...meta, commercialImpactText: e.target.value })}
          />
          <p className="mt-2 text-[11px] text-gray-500">
            Tip: If you leave this unchanged, it will follow the current findings counts.
          </p>
        </div>
      </Card>

      {/* SCORECARD (kept same) */}
      <Card className="mb-6 border-t-2 border-green-500">
        <SectionHeader id="scorecard" title="Section-wise Scorecard" subtitle="Rate each vessel area based on observations." icon={IconCheck} accent="emerald" />
        <div className="p-5 overflow-x-auto bg-gray-50 rounded-b-xl">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Section / Area</th>
                <th className="px-3 py-2 text-left">Score</th>
                <th className="px-3 py-2 text-left">Rating</th>
                <th className="px-3 py-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(areaRatings).map(([area, data]) => (
                <tr key={area} className="border-t">
                  <td className="px-3 py-2 font-medium text-gray-900">{area}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={data.score}
                      onChange={(e) => setAreaRatings((prev) => ({ ...prev, [area]: { ...prev[area], score: Number(e.target.value || 0) } }))}
                      className="w-20 border rounded-lg p-2 bg-white text-gray-900 text-center"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={data.rating}
                      onChange={(e) => setAreaRatings((prev) => ({ ...prev, [area]: { ...prev[area], rating: e.target.value } }))}
                      className="border rounded-lg p-2 bg-white text-gray-900"
                    >
                      <option>Excellent</option>
                      <option>Good</option>
                      <option>Satisfactory</option>
                      <option>Fair</option>
                      <option>Poor</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={data.remarks}
                      onChange={(e) => setAreaRatings((prev) => ({ ...prev, [area]: { ...prev[area], remarks: e.target.value } }))}
                      className="w-full border rounded-lg p-2 bg-white text-gray-900"
                      placeholder="Remarks"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium border-t">
                <td className="px-3 py-2 text-gray-900">Average Score</td>
                <td className="px-3 py-2 text-blue-700">{avgScore}</td>
                <td className="px-3 py-2 text-gray-600" colSpan="2">
                  Overall vessel section performance summary
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* OBSERVATIONS (kept same, just minor safety) */}
      <Card className="mb-6 border-t-2 border-blue-500">
        <SectionHeader
          id="observations"
          title="Observations"
          subtitle="Filter & sort findings. Click an image to enlarge."
          icon={IconClipboard}
          accent="blue"
          right={
            <div className="hidden md:flex items-center gap-2 pr-3">
              <button
                type="button"
                onClick={() => setObsView("grid")}
                className={`px-3 py-1 rounded-lg border ${
                  obsView === "grid" ? "bg-blue-600 text-white border-blue-600" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setObsView("list")}
                className={`px-3 py-1 rounded-lg border ${
                  obsView === "list" ? "bg-blue-600 text-white border-blue-600" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                List
              </button>
            </div>
          }
        />

        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-600">Condition</span>
            <select
              value={obsFilterCond}
              onChange={(e) => setObsFilterCond(e.target.value)}
              className="mt-1 w-full border rounded-lg p-2 bg-white"
            >
              <option value="">All</option>
              <option value="fire_hazard">Fire hazard</option>
              <option value="trip_fall">Trip / fall</option>
              <option value="rust">Rust</option>
              <option value="attention">Attention</option>
              <option value="none">Satisfactory</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs font-medium text-gray-600">Search</span>
            <input
              value={obsSearch}
              onChange={(e) => setObsSearch(e.target.value)}
              placeholder="Search location or comment…"
              className="mt-1 w-full border rounded-lg p-2 bg-white"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-600">Sort by</span>
            <div className="flex gap-2 mt-1">
              <select
                value={obsSort.key}
                onChange={(e) => setObsSort((s) => ({ ...s, key: e.target.value }))}
                className="border rounded-lg p-2 bg-white w-full"
              >
                <option value="index">#</option>
                <option value="condition">Condition</option>
                <option value="location">Location</option>
              </select>
              <select
                value={obsSort.dir}
                onChange={(e) => setObsSort((s) => ({ ...s, dir: e.target.value }))}
                className="border rounded-lg p-2 bg-white"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </label>
        </div>

        <div className="px-5 pb-5">
          {obsFilteredSorted.length === 0 ? (
            <div className="text-gray-500">No observations match the filters.</div>
          ) : obsView === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {obsFilteredSorted.map((row, idx) => {
                const rawItem = row.raw;
                return (
                  <div key={rawItem.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(rawItem)}
                        className="block w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Click to enlarge"
                      >
                        <img
                          src={imageURLFromId(rawItem.id)}
                          alt={rawItem.id}
                          className="w-full h-auto max-h-[70vh] object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.png";
                            e.currentTarget.onerror = null;
                          }}
                        />
                      </button>
                      <div className="absolute top-3 left-3">
                        <Tag value={row.condition} />
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="text-sm font-medium text-gray-900">
                        {rawItem.location ? `Location: ${rawItem.location}` : `Observation #${row.index}`}
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Location</div>
                        <input
                          className="w-full border rounded-lg p-2 bg-white text-gray-900"
                          defaultValue={rawItem.location || ""}
                          placeholder="e.g., Engine Room / Main Deck / Bow"
                          onBlur={(e) => persistRow(row.sourceIndex, { location: e.target.value })}
                        />
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Comment</div>
                        <textarea
                          className="w-full border rounded-lg p-2 bg-white text-gray-900 min-h-[84px]"
                          defaultValue={rawItem.comment || rawItem.comments || ""}
                          onBlur={(e) => persistRow(row.sourceIndex, { comment: e.target.value })}
                        />
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          Recommendations <span className="text-gray-400">(use ; between items)</span>
                        </div>
                        {getNormalizedRecommendationsArray(rawItem).length > 0 ? (
                          <textarea
                            className="w-full border rounded-lg p-2 bg-white text-gray-900 min-h-[84px]"
                            defaultValue={getNormalizedRecommendationsArray(rawItem).join("; ")}
                            onBlur={(e) =>
                              persistRow(row.sourceIndex, { recommendations_high_severity_only: e.target.value })
                            }
                          />
                        ) : (
                          <div className="text-xs text-gray-400">—</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 w-10">#</th>
                    <th className="text-left font-medium px-3 py-2 w-28">Photo</th>
                    <th className="text-left font-medium px-3 py-2 w-40">Location</th>
                    <th className="text-left font-medium px-3 py-2 w-32">Condition</th>
                    <th className="text-left font-medium px-3 py-2">Comment</th>
                    <th className="text-left font-medium px-3 py-2 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {obsFilteredSorted.map((row) => (
                    <tr key={row.id} className="border-b align-top">
                      <td className="px-3 py-2 text-gray-500">{row.index}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="w-28 h-20 rounded-lg border bg-gray-100 overflow-hidden p-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={() => setSelectedPhoto(row.raw)}
                        >
                          <img
                            src={imageURLFromId(row.id)}
                            alt={row.id}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.png";
                              e.currentTarget.onerror = null;
                            }}
                          />
                        </button>
                      </td>
                      <td className="px-3 py-2">{row.location || "—"}</td>
                      <td className="px-3 py-2">
                        <Tag value={row.condition} />
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <div className="line-clamp-3">{(row.raw.comment || row.raw.comments || "").trim() || "—"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(row.raw)}
                          className="text-xs px-3 py-1 rounded-lg border text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* DEFECTS (kept same card-grid design) */}
      <Card className="mb-6 border-t-2 border-rose-500">
        <SectionHeader
          id="defects"
          title="Defects & non-conformities"
          subtitle="Auto-prepared from observations. You can add/edit/delete."
          icon={IconAlert}
          accent="rose"
          right={
            <button className="px-3 py-1 rounded-lg border text-gray-700 hover:bg-gray-50" onClick={() => setAddOpen(true)}>
              + Add Defect
            </button>
          }
        />

        <div className="p-4">
          {hazardRowsDerived.length === 0 ? (
            <div className="px-3 py-6 text-center text-gray-500 border rounded-lg bg-white">No defects / non-conformities.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {hazardRowsDerived.map((row, i) => {
                const photoId = row.photoId || row.id;
                const photo = photoId ? perImage.find((x) => x.id === photoId) : null;

                return (
                  <div key={row.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => photo && setSelectedPhoto(photo)}
                        className="block w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Click to enlarge"
                      >
                        <img
                          src={photoId ? imageURLFromId(photoId) : "/placeholder.png"}
                          alt={photoId || `defect-${i + 1}`}
                          className="w-full h-auto max-h-[70vh] object-contain bg-gray-50"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.png";
                            e.currentTarget.onerror = null;
                          }}
                        />
                      </button>

                      <div className="absolute top-3 left-3">
                        <Tag value={row.condition || "attention"} />
                      </div>

                      <button
                        className="absolute top-3 right-3 text-xs w-8 h-8 inline-flex items-center justify-center rounded-md border text-red-700 bg-white/90 hover:bg-red-50"
                        onClick={() => deleteDefect(row.id, !!row.manual)}
                        title="Delete"
                        aria-label="Delete"
                        type="button"
                      >
                        ×
                      </button>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">Area</span>
                          <input
                            className="mt-1 w-full border rounded-lg p-2 bg-white text-gray-900"
                            value={row.area || ""}
                            onChange={(e) => updateDefect(row.id, { area: e.target.value })}
                            placeholder="Area"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">Condition</span>
                          <select
                            className="mt-1 w-full border rounded-lg p-2 bg-white text-gray-900"
                            value={row.condition || "attention"}
                            onChange={(e) => updateDefect(row.id, { condition: e.target.value })}
                          >
                            <option value="fire_hazard">Fire hazard</option>
                            <option value="trip_fall">Trip / fall</option>
                            <option value="rust">Rust</option>
                            <option value="attention">Attention</option>
                            <option value="none">Satisfactory</option>
                          </select>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">Assigned</span>
                          <input
                            className="mt-1 w-full border rounded-lg p-2 bg-white text-gray-900"
                            value={row.assignedTo || ""}
                            onChange={(e) => updateDefect(row.id, { assignedTo: e.target.value })}
                            placeholder="Name"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">Deadline</span>
                          <input
                            type="date"
                            className="mt-1 w-full border rounded-lg p-2 bg-white text-gray-900"
                            value={row.deadline || ""}
                            onChange={(e) => updateDefect(row.id, { deadline: e.target.value })}
                          />
                        </label>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Recommendations</div>
                        {row.manual ? (
                          <textarea
                            className="w-full border rounded-lg p-2 bg-white text-gray-900 min-h-[84px]"
                            value={row.combined || ""}
                            onChange={(e) => updateDefect(row.id, { combined: e.target.value })}
                            placeholder="Recommendations"
                          />
                        ) : (
                          <div className="text-sm text-gray-800 whitespace-pre-wrap">{row.recommendations ? row.recommendations : "—"}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-2 text-[11px] text-gray-500">Tip: click a photo thumbnail to preview. Comments remain available in the photo modal.</p>
        </div>
      </Card>

      {/* PHOTO GALLERY (new, minimal design: uses your existing photo card style) */}
      <Card className="mb-6 border-t-2 border-blue-500">
        <SectionHeader
          id="photoGallery"
          title="Photo gallery"
          subtitle="Grouped by location (uses your editable location field)."
          icon={IconDoc}
          accent="blue"
        />
        <div className="p-5 space-y-6">
          {photoGalleryGroups.map((group) => (
            <div key={group.locationName} className="rounded-xl border bg-white overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <div className="font-medium text-gray-900">{group.locationName}</div>
                <div className="text-xs text-gray-500">{group.items.length} photo(s)</div>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {group.items.map((imageItem) => (
                  <button
                    key={imageItem.id}
                    type="button"
                    className="rounded-lg border bg-gray-50 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setSelectedPhoto(imageItem)}
                    title="Click to view"
                  >
                    <img
                      src={imageURLFromId(imageItem.id)}
                      alt={imageItem.id}
                      className="w-full h-28 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.png";
                        e.currentTarget.onerror = null;
                      }}
                    />
                    <div className="px-2 py-2 flex items-center justify-between gap-2 bg-white border-t">
                      <span className="text-xs text-gray-600">#{imageItem.id}</span>
                      <Tag value={resolveEffectiveCondition(imageItem)} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Photo modal (kept same) */}
      {selectedPhoto ? (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="text-sm font-semibold text-gray-900">{selectedPhoto.id}</div>
              <button className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50" onClick={() => setSelectedPhoto(null)}>
                Close
              </button>
            </div>
            <div className="p-4">
              <img
                src={imageURLFromId(selectedPhoto.id)}
                alt={selectedPhoto.id}
                className="w-full max-h-[70vh] object-contain rounded-lg bg-gray-50"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.png";
                  e.currentTarget.onerror = null;
                }}
              />
              <div className="mt-3 text-sm text-gray-700">
                <div className="mt-2">
                  <div className="text-xs font-medium text-gray-600 mb-1">Location</div>
                  <input
                    className="w-full border rounded-lg p-2 bg-white text-gray-900"
                    defaultValue={selectedPhoto.location || ""}
                    placeholder="Add location for this photo"
                    onBlur={(e) => {
                      const newLocationValue = e.target.value;
                      const idx = perImage.findIndex((x) => x.id === selectedPhoto.id);
                      if (idx >= 0) persistRow(idx, { location: newLocationValue });
                      setSelectedPhoto((p) => ({ ...p, location: newLocationValue }));
                    }}
                  />
                </div>
                <div className="mt-2">
                  <b>Condition:</b> {conditionLabel(resolveEffectiveCondition(selectedPhoto))}
                </div>
                {(selectedPhoto.comment || selectedPhoto.comments) ? (
                  <div className="mt-2 whitespace-pre-wrap">
                    <b>Comment:</b> {(selectedPhoto.comment || selectedPhoto.comments).toString()}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add defect modal (kept same) */}
      {addOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setAddOpen(false)}>
          <div className="bg-white rounded-xl max-w-xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="text-sm font-semibold text-gray-900">Add Defect</div>
              <button className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50" onClick={() => setAddOpen(false)}>
                Close
              </button>
            </div>

            <div className="p-4 space-y-3">
              <Input label="Photo ID (optional)" value={addForm.photoId} onChange={(e) => setAddForm((p) => ({ ...p, photoId: e.target.value }))} />
              <Input label="Area" value={addForm.area} onChange={(e) => setAddForm((p) => ({ ...p, area: e.target.value }))} />
              <Input label="Assigned To" value={addForm.assignedTo} onChange={(e) => setAddForm((p) => ({ ...p, assignedTo: e.target.value }))} />

              <label className="block">
                <span className="text-xs font-medium text-gray-600">Condition</span>
                <select
                  className="mt-1 w-full border rounded-lg p-2 bg-white"
                  value={addForm.condition}
                  onChange={(e) => setAddForm((p) => ({ ...p, condition: e.target.value }))}
                >
                  <option value="fire_hazard">Fire hazard</option>
                  <option value="trip_fall">Trip / fall</option>
                  <option value="rust">Rust</option>
                  <option value="attention">Attention</option>
                  <option value="none">Satisfactory</option>
                </select>
              </label>

              <Input label="Deadline" type="date" value={addForm.deadline} onChange={(e) => setAddForm((p) => ({ ...p, deadline: e.target.value }))} />
              <TextArea label="Details" rows={4} value={addForm.combined} onChange={(e) => setAddForm((p) => ({ ...p, combined: e.target.value }))} />

              <div className="flex gap-2 justify-end pt-2">
                <button className="px-4 py-2 rounded-lg border hover:bg-gray-50" onClick={() => setAddOpen(false)}>
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={onSaveAdd}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}



// // SummaryV2.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import api from "../api";
// import { useReactToPrint } from "react-to-print";
// import PrintReport from "./PrintReport";

// /** Safe JSON parse */
// function safeJSONParse(jsonString, fallbackValue) {
//   try {
//     return JSON.parse(jsonString);
//   } catch {
//     return fallbackValue;
//   }
// }

// /** LocalStorage helpers */
// const REPORT_META_STORAGE_KEY = "iship_report_meta_v1";
// function readReportMetaFromLocalStorage() {
//   const storedValue = localStorage.getItem(REPORT_META_STORAGE_KEY);
//   const parsed = safeJSONParse(storedValue || "null", null);
//   return parsed && typeof parsed === "object" ? parsed : null;
// }
// function writeReportMetaToLocalStorage(nextMeta) {
//   localStorage.setItem(REPORT_META_STORAGE_KEY, JSON.stringify(nextMeta));
// }

// /** Inline icons */
// const IconDoc = (props) => (
//   <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
//     <rect x="3" y="2" width="14" height="16" rx="2" fill="currentColor" fillOpacity="0.12" />
//     <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
//     <rect x="6" y="6" width="8" height="1.5" rx="0.75" fill="currentColor" />
//     <rect x="6" y="9" width="8" height="1.5" rx="0.75" fill="currentColor" />
//     <rect x="6" y="12" width="5" height="1.5" rx="0.75" fill="currentColor" />
//   </svg>
// );
// const IconClipboard = (props) => (
//   <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
//     <rect x="5" y="3" width="10" height="14" rx="2" fill="currentColor" fillOpacity="0.12" />
//     <rect x="5" y="3" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
//     <rect x="8" y="2" width="4" height="3" rx="1" fill="currentColor" />
//   </svg>
// );
// const IconUsers = (props) => (
//   <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
//     <circle cx="7" cy="8" r="3" fill="currentColor" fillOpacity="0.12" />
//     <circle cx="13" cy="10" r="2" fill="currentColor" fillOpacity="0.12" />
//     <circle cx="7" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
//     <circle cx="13" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
//     <path
//       d="M3 16c0-2.21 2.686-4 6-4s6 1.79 6 4"
//       stroke="currentColor"
//       strokeWidth="1.5"
//       strokeLinecap="round"
//     />
//   </svg>
// );
// const IconAlert = (props) => (
//   <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
//     <circle cx="10" cy="10" r="8" fill="currentColor" fillOpacity="0.12" />
//     <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
//     <rect x="9" y="5" width="2" height="6" rx="1" fill="currentColor" />
//     <rect x="9" y="13" width="2" height="2" rx="1" fill="currentColor" />
//   </svg>
// );
// const IconCheck = (props) => (
//   <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
//     <circle cx="10" cy="10" r="8" fill="currentColor" fillOpacity="0.12" />
//     <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
//     <path d="M6 10.5l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//   </svg>
// );

// const sectionAccent = {
//   blue: "border-t-blue-500 bg-blue-50",
//   cyan: "border-t-cyan-500 bg-cyan-50",
//   violet: "border-t-violet-500 bg-violet-50",
//   emerald: "border-t-emerald-500 bg-emerald-50",
//   amber: "border-t-amber-500 bg-amber-50",
//   rose: "border-t-rose-500 bg-rose-50",
//   slate: "border-t-slate-500 bg-slate-50",
//   default: "border-t-slate-300",
// };
// const iconAccent = {
//   blue: "bg-blue-100 text-blue-600",
//   cyan: "bg-cyan-100 text-cyan-600",
//   violet: "bg-violet-100 text-violet-600",
//   emerald: "bg-emerald-100 text-emerald-600",
//   amber: "bg-amber-100 text-amber-600",
//   rose: "bg-rose-100 text-rose-600",
//   slate: "bg-slate-100 text-slate-600",
//   default: "bg-slate-100 text-slate-600",
// };

// const SectionHeader = ({ id, title, subtitle, right, icon: Icon, accent = "default" }) => (
//   <div
//     id={id}
//     className={`px-5 py-4 border-b border-t ${sectionAccent[accent] || sectionAccent.default} rounded-t-xl flex items-center justify-between`}
//   >
//     <div className="flex items-center gap-3">
//       {Icon ? (
//         <span
//           className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${iconAccent[accent] || iconAccent.default}`}
//         >
//           <Icon className="w-5 h-5" />
//         </span>
//       ) : null}
//       <div>
//         <h2 className="font-semibold text-gray-900">{title}</h2>
//         {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
//       </div>
//     </div>
//     {right}
//   </div>
// );

// const Card = ({ children, className = "" }) => (
//   <div className={`rounded-xl border shadow-lg hover:shadow-xl transition bg-white ${className}`}>{children}</div>
// );

// const Input = ({ label, className = "", ...props }) => (
//   <label className="block">
//     <span className="text-xs font-medium text-gray-600">{label}</span>
//     <input {...props} className={`mt-1 w-full border rounded-lg p-2 bg-white text-gray-900 placeholder-gray-400 ${className}`} />
//   </label>
// );

// const TextArea = ({ label, rows = 4, className = "", ...props }) => (
//   <label className="block">
//     <span className="text-xs font-medium text-gray-600">{label}</span>
//     <textarea
//       rows={rows}
//       {...props}
//       className={`mt-1 w-full border rounded-lg p-2 bg-white text-gray-900 placeholder-gray-400 ${className}`}
//     />
//   </label>
// );

// const KeyMetric = ({ label, value, tone = "slate" }) => (
//   <div className="rounded-xl border bg-white shadow-sm p-4">
//     <div className="text-xs text-gray-500">{label}</div>
//     <div
//       className={`text-3xl font-semibold mt-1 ${
//         tone === "red"
//           ? "text-red-700"
//           : tone === "amber"
//           ? "text-amber-700"
//           : tone === "green"
//           ? "text-emerald-700"
//           : tone === "blue"
//           ? "text-blue-700"
//           : "text-gray-900"
//       }`}
//     >
//       {value}
//     </div>
//   </div>
// );

// const Tag = ({ value }) => {
//   const labelMap = {
//     fire_hazard: "Fire hazard",
//     trip_fall: "Trip/Fall",
//     none: "Satisfactory",
//     rust: "Rust",
//     attention: "Attention",
//   };
//   const color =
//     value === "fire_hazard"
//       ? "bg-red-50 text-red-700 border-red-200"
//       : value === "trip_fall"
//       ? "bg-amber-50 text-amber-800 border-amber-200"
//       : value === "rust"
//       ? "bg-orange-50 text-orange-800 border-orange-200"
//       : value === "attention"
//       ? "bg-sky-50 text-sky-800 border-sky-200"
//       : "bg-emerald-50 text-emerald-800 border-emerald-200";
//   return <span className={`text-xs px-2 py-1 rounded-full border ${color}`}>{labelMap[value] || value}</span>;
// };

// /**
//  * Normalizers + Effective condition resolver
//  * (kept compatible with your existing per_image contract)
//  */
// const getNormalizedCondition = (item) => ((item?.condition ?? item?.condition_type ?? "none") + "").toString();
// const getNormalizedComment = (item) => ((item?.comment ?? item?.comments ?? "") + "").toString();

// const getNormalizedRecommendationsArray = (item) => {
//   if (Array.isArray(item?.recommendations_high_severity_only)) return item.recommendations_high_severity_only;
//   if (Array.isArray(item?.recommendations)) return item.recommendations;
//   if (typeof item?.recommendations_high_severity_only === "string") {
//     return item.recommendations_high_severity_only
//       .split(";")
//       .map((segment) => segment.trim())
//       .filter(Boolean);
//   }
//   return [];
// };

// const resolveEffectiveCondition = (perImageItem) => {
//   const rawCondition = getNormalizedCondition(perImageItem);
//   if (rawCondition !== "none") return rawCondition;

//   const tagsObject = perImageItem?.tags || {};
//   const hasRustStainsTag = Boolean(tagsObject?.rust_stains);

//   const highSeverityRecommendationsArray = Array.isArray(perImageItem?.recommendations_high_severity_only)
//     ? perImageItem.recommendations_high_severity_only
//     : [];
//   const hasHighSeverityRecommendations = highSeverityRecommendationsArray.length > 0;

//   const fallbackRecommendationsArray = Array.isArray(perImageItem?.recommendations) ? perImageItem.recommendations : [];
//   const hasAnyRecommendations = fallbackRecommendationsArray.length > 0;

//   const severityLevel = (perImageItem?.severity_level || "").toString().toLowerCase();
//   const priorityLevel = (perImageItem?.priority || "").toString().toLowerCase();
//   const isHighOrExtremeSeverity = severityLevel === "high" || severityLevel === "extreme";
//   const isImmediateOrCriticalPriority = priorityLevel === "immediate action required" || priorityLevel === "critical";

//   if (hasRustStainsTag) return "rust";
//   if (hasHighSeverityRecommendations || hasAnyRecommendations || isHighOrExtremeSeverity || isImmediateOrCriticalPriority) return "attention";
//   return "none";
// };

// const conditionLabel = (value) => {
//   const map = {
//     fire_hazard: "Fire hazard",
//     trip_fall: "Trip/Fall",
//     none: "Satisfactory",
//     rust: "Rust",
//     attention: "Attention",
//   };
//   return map[value] || value || "—";
// };

// function defaultDistributionList() {
//   return [
//     { role: "Owner", name: "", email: "" },
//     { role: "Manager", name: "", email: "" },
//     { role: "Charterer", name: "", email: "" },
//   ];
// }

// function defaultAbbreviationsText() {
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
//     "SOPEP = Shipboard Oil Pollution Emergency Plan",
//     "OWS = Oily Water Separator",
//   ].join("\n");
// }

// function defaultDisclaimerText() {
//   return (
//     "This report is based on a visual inspection conducted at the stated time and location. " +
//     "Findings reflect conditions observed at the time of inspection and are subject to change. " +
//     "No dismantling, intrusive testing, or statutory verification was undertaken unless explicitly stated. " +
//     "This report is provided for informational purposes only and should not be construed as a warranty or guarantee."
//   );
// }

// function computeCommercialImpactText({ fireCount, tripCount, rustCount, attentionCount }) {
//   const totalIssues = (fireCount || 0) + (tripCount || 0) + (rustCount || 0) + (attentionCount || 0);
//   if (totalIssues === 0) {
//     return "No critical/high impact findings were identified in the sampled set. Continue routine inspections and preventive maintenance, and close out minor observations through standard planned maintenance.";
//   }
//   if ((fireCount || 0) > 0) {
//     return "Fire hazards can increase operational risk and may impact compliance outcomes if not addressed. Immediate corrective actions are recommended for any fire-related findings, including housekeeping improvements, removal of ignition sources, and verification of firefighting readiness.";
//   }
//   if ((tripCount || 0) > 0) {
//     return "Trip/fall hazards may lead to crew injury and lost time incidents, increasing operational disruption and liability exposure. Prioritize housekeeping, route clearance, and signage where applicable.";
//   }
//   if ((attentionCount || 0) > 0) {
//     return "Items marked 'Attention' may increase maintenance cost and reduce operational efficiency if left unaddressed. Prioritize corrective actions in the next maintenance window and monitor for recurrence.";
//   }
//   if ((rustCount || 0) > 0) {
//     return "Rust/corrosion findings typically increase maintenance scope and may reduce equipment life. Schedule surface preparation, coating renewal, and follow-up inspections to prevent progression.";
//   }
//   return "Findings require routine follow-up. Close out corrective actions with evidence (photos, checklists, logs) and verify during subsequent inspections.";
// }

// export default function SummaryV2({ model = "openai" }) {
//   // ---- baseURL image helper
//   const imageURLFromId = (id) => `${api.defaults.baseURL}/uploads/${encodeURIComponent(id)}`;

//   // ---- load localStorage safely
//   const [storageVersion, setStorageVersion] = useState(0);

//   const results = useMemo(() => {
//     const stored = safeJSONParse(localStorage.getItem("iship_results") || "{}", {});
//     const modelBucket = stored?.results?.[model] || {};
//     return modelBucket && typeof modelBucket === "object" ? modelBucket : {};
//   }, [model, storageVersion]);

//   const perImage = Array.isArray(results?.per_image) ? results.per_image : [];
//   const counts = results?.batch_summary || { fire_hazard_count: 0, trip_fall_count: 0, none_count: 0 };

//   // ---- meta (extended, but keeps existing fields unchanged)
//   const [meta, setMeta] = useState(() => {
//     const storedMeta = readReportMetaFromLocalStorage();

//     const baseMeta = {
//       // existing
//       date: new Date().toISOString().slice(0, 10),
//       vesselName: "",
//       imo: "",
//       flag: "",
//       callSign: "",
//       location: "",
//       inspector: "",
//       reportRef: "",
//       weather: "",
//       scope: "General safety walk-through of accessible areas; visual-only.",
//       methodology: "Visual inspection, photo tagging via computer vision, rule-based hazard checks.",
//       limitations: "No confined space entry; no dismantling of machinery; weather & access permitting.",
//       overallRating: "Satisfactory",
//       score: null,
//       summaryBlurb:
//         "The vessel presents generally good housekeeping. One fire hazard was identified near machinery due to oil residue. No trip/fall issues were found in sampled areas.",

//       // crew fields already used in UI
//       crewTotal: "",
//       officers: "",
//       ratings: "",

//       // NEW: required sections (for UI + PrintReport props; PrintReport can choose to use them later)
//       disclaimerText: defaultDisclaimerText(),
//       distributionList: defaultDistributionList(),
//       termsText:
//         "Observation: A recorded condition noted during inspection (may or may not require action).\n" +
//         "Defect / Non-conformity: A condition requiring attention or corrective action.\n" +
//         "Severity: Indicative impact level (low/medium/high/critical).\n" +
//         "Priority: Urgency for action (low/medium/high/critical).",
//       abbreviationsText: defaultAbbreviationsText(),
//       referencesText: "",

//       // Vessel particulars (more complete)
//       vesselType: "",
//       vesselClass: "",
//       vesselDWT: "",
//       vesselGT: "",
//       vesselLOA: "",
//       vesselBeam: "",
//       vesselYearBuilt: "",
//       vesselPortOfRegistry: "",

//       // Inspector particulars (more complete)
//       inspectorCompany: "",
//       inspectorEmail: "",
//       inspectorPhone: "",
//       inspectorCredentials: "",

//       // Vessel movement
//       lastPort: "",
//       currentPort: "",
//       nextPort: "",
//       eta: "",
//       etd: "",
//       berthOrAnchorage: "",
//       voyageNotes: "",
//     };

//     if (!storedMeta) return baseMeta;
//     return { ...baseMeta, ...storedMeta };
//   });

//   // persist meta (so it survives reload)
//   useEffect(() => {
//     writeReportMetaToLocalStorage(meta);
//   }, [meta]);

//   // ---- section scorecard
//   const [areaRatings, setAreaRatings] = useState({
//     Accommodation: { score: 90, rating: "Excellent", remarks: "" },
//     Bridge: { score: 85, rating: "Good", remarks: "" },
//     "Engine Room": { score: 80, rating: "Good", remarks: "" },
//     "Hull Area": { score: 70, rating: "Satisfactory", remarks: "" },
//     "Cargo Control Room": { score: 75, rating: "Satisfactory", remarks: "" },
//   });

//   const avgScore = useMemo(() => {
//     const vals = Object.values(areaRatings || {});
//     if (!vals.length) return "0";
//     const n = vals.reduce((sum, a) => sum + (Number(a?.score) || 0), 0) / vals.length;
//     return n.toFixed(1);
//   }, [areaRatings]);

//   // ---- observations
//   const [selectedPhoto, setSelectedPhoto] = useState(null);
//   const [obsView, setObsView] = useState("grid");
//   const [obsFilterCond, setObsFilterCond] = useState("");
//   const [obsSearch, setObsSearch] = useState("");
//   const [obsSort, setObsSort] = useState({ key: "index", dir: "asc" });

//   const obsRows = useMemo(() => {
//     return perImage.map((it, i) => {
//       const text = [it.id, it.location, getNormalizedComment(it)].filter(Boolean).join(" ").toLowerCase();
//       return {
//         raw: it,
//         index: i + 1,
//         sourceIndex: i, // IMPORTANT for persistence
//         id: it.id,
//         location: it.location || "",
//         condition: resolveEffectiveCondition(it),
//         text,
//       };
//     });
//   }, [perImage]);

//   const obsFilteredSorted = useMemo(() => {
//     let list = obsRows;

//     if (obsFilterCond) list = list.filter((r) => r.condition === obsFilterCond);
//     if (obsSearch.trim()) {
//       const query = obsSearch.trim().toLowerCase();
//       list = list.filter((r) => r.text.includes(query));
//     }

//     const { key, dir } = obsSort;
//     const mul = dir === "desc" ? -1 : 1;
//     list = [...list].sort((a, b) => {
//       const av = a[key] ?? "";
//       const bv = b[key] ?? "";
//       if (av === bv) return 0;
//       return (av > bv ? 1 : -1) * mul;
//     });

//     return list;
//   }, [obsRows, obsFilterCond, obsSearch, obsSort]);

//   // ---- persist row comment / recs into localStorage under SAME model bucket
//   const persistRow = (rowIndex, updater) => {
//     const copy = safeJSONParse(localStorage.getItem("iship_results") || "{}", {});
//     if (!copy.results) copy.results = {};
//     if (!copy.results[model]) copy.results[model] = {};
//     const list = Array.isArray(copy.results[model].per_image) ? copy.results[model].per_image : [];
//     if (!list[rowIndex]) return;

//     const next = { ...list[rowIndex], ...updater };
//     if (typeof next.recommendations_high_severity_only === "string") {
//       next.recommendations_high_severity_only = next.recommendations_high_severity_only
//         .split(";")
//         .map((s) => s.trim())
//         .filter(Boolean);
//     }
//     list[rowIndex] = next;
//     copy.results[model].per_image = list;
//     localStorage.setItem("iship_results", JSON.stringify(copy));
//     setStorageVersion((v) => v + 1);
//   };

//   // ---- defects (manual + overrides)
//   const DEFECTS_KEY = "iship_defects_v1";
//   const [defects, setDefects] = useState(() => safeJSONParse(localStorage.getItem(DEFECTS_KEY) || "{}", {}));
//   const getDefect = (id) => defects[id] || {};
//   const updateDefect = (id, patch) => {
//     setDefects((prev) => {
//       const next = { ...prev, [id]: { ...prev[id], ...patch } };
//       localStorage.setItem(DEFECTS_KEY, JSON.stringify(next));
//       return next;
//     });
//   };
//   const deleteDefect = (id, isManual) => {
//     setDefects((prev) => {
//       const next = { ...prev };
//       if (isManual) delete next[id];
//       else next[id] = { ...(next[id] || {}), hidden: true };
//       localStorage.setItem(DEFECTS_KEY, JSON.stringify(next));
//       return next;
//     });
//   };

//   const hazardRowsDerived = useMemo(() => {
//     const derived = perImage
//       .map((it, i) => {
//         const effectiveCondition = resolveEffectiveCondition(it);
//         const recommendationsArray = getNormalizedRecommendationsArray(it);
//         const hasRecommendations = recommendationsArray.length > 0;

//         if (effectiveCondition === "none" && !hasRecommendations) return null;

//         const overrides = getDefect(it.id);
//         if (overrides?.hidden) return null;

//         return {
//           id: it.id,
//           photoId: it.id,
//           index: i + 1,
//           area: it.location || "—",
//           condition: effectiveCondition,
//           comment: getNormalizedComment(it),
//           recommendations: recommendationsArray.join("; ") || "",
//           assignedTo: "",
//           deadline: "",
//           manual: false,
//           ...overrides,
//         };
//       })
//       .filter(Boolean);

//     const manual = Object.values(defects)
//       .filter((d) => d && d.manual && !d.hidden)
//       .map((d, j) => ({
//         id: d.id,
//         index: derived.length + j + 1,
//         area: d.area || "—",
//         condition: d.condition || "attention",
//         combined: d.combined || "",
//         assignedTo: d.assignedTo || "",
//         deadline: d.deadline || "",
//         photoId: d.photoId || "",
//         manual: true,
//       }));

//     return [...derived, ...manual];
//   }, [perImage, defects]);

//   const countsDerived = useMemo(() => {
//     const fire = hazardRowsDerived.filter((r) => r.condition === "fire_hazard").length;
//     const trip = hazardRowsDerived.filter((r) => r.condition === "trip_fall").length;
//     const rust = hazardRowsDerived.filter((r) => r.condition === "rust").length;
//     const attention = hazardRowsDerived.filter((r) => r.condition === "attention").length;
//     const missingTs = perImage.filter((it) => !(it.timestamp || it.capture_time || it?.exif?.DateTimeOriginal)).length;
//     return { fire, trip, rust, attention, missingTs };
//   }, [hazardRowsDerived, perImage]);

//   const [editFindings, setEditFindings] = useState(false);
//   const [findings, setFindings] = useState({ fire: 0, trip: 0, rust: 0, attention: 0, missingTs: 0 });

//   useEffect(() => {
//     setFindings({
//       fire: countsDerived.fire,
//       trip: countsDerived.trip,
//       rust: countsDerived.rust,
//       attention: countsDerived.attention,
//       missingTs: countsDerived.missingTs,
//     });
//   }, [countsDerived]);

  

//   // ---- add defect modal
//   const [addOpen, setAddOpen] = useState(false);
//   const [addForm, setAddForm] = useState({
//     photoId: "",
//     area: "",
//     assignedTo: "",
//     condition: "attention",
//     combined: "",
//     deadline: "",
//   });

//   const onSaveAdd = () => {
//     const key = `manual-${Date.now()}`;
//     const entry = {
//       id: key,
//       photoId: addForm.photoId?.trim() || "",
//       area: addForm.area || "—",
//       assignedTo: addForm.assignedTo || "",
//       condition: addForm.condition || "attention",
//       combined: addForm.combined || "",
//       deadline: addForm.deadline || "",
//       manual: true,
//     };
//     setDefects((prev) => {
//       const next = { ...prev, [key]: entry };
//       localStorage.setItem(DEFECTS_KEY, JSON.stringify(next));
//       return next;
//     });
//     setAddOpen(false);
//     setAddForm({ photoId: "", area: "", assignedTo: "", condition: "attention", combined: "", deadline: "" });
//   };

//   // ---- AI summary generation
//   const [genBusy, setGenBusy] = useState(false);

//   const buildSummaryPayload = () => {
//     const hazards = perImage.map((it) => ({
//       id: it.id,
//       location: it.location || "",
//       condition: resolveEffectiveCondition(it),
//       tags: it.tags || {},
//       comment: getNormalizedComment(it),
//       recs: getNormalizedRecommendationsArray(it).join("; "),
//     }));
//     return {
//       meta: {
//         vesselName: meta.vesselName,
//         date: meta.date,
//         location: meta.location,
//         inspector: meta.inspector,
//       },
//       counts: results?.batch_summary || {},
//       hazards,
//     };
//   };

//   const localHeuristicSummary = () => {
//     const c = results?.batch_summary || { fire_hazard_count: 0, trip_fall_count: 0, none_count: 0 };
//     const locCounts = {};
//     perImage.forEach((it) => {
//       const key = it.location || "unspecified area";
//       locCounts[key] = (locCounts[key] || 0) + 1;
//     });
//     const topLocs = Object.entries(locCounts)
//       .sort((a, b) => b[1] - a[1])
//       .slice(0, 2)
//       .map(([k]) => k)
//       .join(" & ");
//     const parts = [];
//     parts.push(
//       `The inspection on ${meta.date || "the stated date"} at ${meta.location || "the reported location"} covered ${
//         perImage.length
//       } photos across ${Object.keys(locCounts).length} area(s).`
//     );
//     if (c.fire_hazard_count) parts.push(`${c.fire_hazard_count} fire hazard(s) were flagged.`);
//     if (c.trip_fall_count) parts.push(`${c.trip_fall_count} trip/fall issue(s) noted.`);
//     if (!c.fire_hazard_count && !c.trip_fall_count) parts.push("No critical hazards were detected in the sampled set.");
//     parts.push(`Most photos came from ${topLocs || "varied areas"}.`);
//     return parts.join(" ");
//   };

//   const generateSummary = async () => {
//     setGenBusy(true);
//     try {
//       const payload = buildSummaryPayload();
//       let text = "";
//       try {
//         const { data } = await api.post("/api/summarize", payload);
//         text = data?.summary || "";
//         if (data?.overallRating) setMeta((m) => ({ ...m, overallRating: data.overallRating }));
//         if (typeof data?.score === "number") {
//           const scoreNumber = Math.max(0, Math.min(100, Math.round(data.score)));
//           setMeta((m) => ({ ...m, score: scoreNumber }));
//         }
//       } catch {
//         text = localHeuristicSummary();
//         const c = results?.batch_summary || { fire_hazard_count: 0, trip_fall_count: 0, none_count: 0 };
//         const total = (c.fire_hazard_count || 0) + (c.trip_fall_count || 0);
//         const scoreNumber = Math.max(0, 100 - total * 10);
//         const rating =
//           scoreNumber >= 90 ? "Excellent" : scoreNumber >= 75 ? "Good" : scoreNumber >= 60 ? "Satisfactory" : scoreNumber >= 40 ? "Fair" : "Poor";
//         setMeta((m) => ({ ...m, overallRating: rating, score: scoreNumber }));
//       }
//       setMeta((m) => ({ ...m, summaryBlurb: text || m.summaryBlurb }));
//     } finally {
//       setGenBusy(false);
//     }
//   };

//   useEffect(() => {
//     const t = (meta.summaryBlurb || "").trim();
//     if (!t || t.length < 20) generateSummary();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ---- PRINT / PDF
//   const printRef = useRef(null);

//   const waitForImages = async (rootEl) => {
//     if (!rootEl) return;
//     const imageElements = Array.from(rootEl.querySelectorAll("img"));
//     await Promise.all(
//       imageElements.map((img) => {
//         if (img.complete && img.naturalWidth > 0) return Promise.resolve();
//         return new Promise((resolve) => {
//           img.onload = () => resolve();
//           img.onerror = () => resolve();
//         });
//       })
//     );
//   };

//   const triggerPrint = useReactToPrint({
//     contentRef: printRef,
//     content: () => printRef.current,
//     documentTitle: `${(meta?.vesselName || "Vessel").toString().trim() || "Vessel"}_Inspection_Report`,
//     removeAfterPrint: false,
//     onBeforeGetContent: async () => {
//       if (printRef.current) await waitForImages(printRef.current);
//     },
//     onBeforePrint: async () => {
//       if (printRef.current) await waitForImages(printRef.current);
//     },
//     onPrintError: (err) => {
//       // eslint-disable-next-line no-console
//       console.error("Print error:", err);
//       alert("PDF export failed. Open Console for details.");
//     },
//   });

//   const onDownloadPDF = () => {
//     if (!printRef.current) {
//       // eslint-disable-next-line no-console
//       console.error("Print node ref is null. Ensure PrintReport uses forwardRef and attaches ref to a DOM element.");
//       alert("PDF export not ready: printable report is not mounted. Please ensure PrintReport uses forwardRef.");
//       return;
//     }
//     if (typeof triggerPrint === "function") {
//       triggerPrint();
//       return;
//     }
//     window.print();
//   };

//   // ---- Photo Gallery (UI only): group photos by location
//   const photoGalleryGroups = useMemo(() => {
//     const groupsMap = new Map();
//     perImage.forEach((imageItem) => {
//       const locationValue = (imageItem.location || "").toString().trim() || "Unspecified area";
//       const arr = groupsMap.get(locationValue) || [];
//       arr.push(imageItem);
//       groupsMap.set(locationValue, arr);
//     });
//     return Array.from(groupsMap.entries())
//       .map(([locationName, items]) => ({ locationName, items }))
//       .sort((a, b) => a.locationName.localeCompare(b.locationName));
//   }, [perImage]);

//   const commercialImpactText = useMemo(() => {
//     return computeCommercialImpactText({
//       fireCount: findings.fire,
//       tripCount: findings.trip,
//       rustCount: findings.rust,
//       attentionCount: findings.attention,
//     });
//   }, [findings.fire, findings.trip, findings.rust, findings.attention]);

//   // ---- If no data, show message (not blank)
//   if (!perImage.length) {
//     return (
//       <div className="max-w-6xl mx-auto py-10 text-gray-700">
//         <div className="rounded-xl border bg-white p-6">
//           <div className="text-lg font-semibold">No results yet</div>
//           <div className="mt-2 text-sm text-gray-600">
//             Please upload and analyze photos first (ensure <b>iship_results</b> exists in localStorage).
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto py-0 pb-6 print:py-0">
//       {/* Off-screen printable node */}
//       <div style={{ position: "absolute", left: "-10000px", top: 0, width: "794px", padding: "24px", background: "white" }} aria-hidden="true">
//         <PrintReport
//           ref={printRef}
//           meta={meta}
//           counts={counts}
//           perImage={perImage}
//           obsRows={obsRows}
//           hazardRowsDerived={hazardRowsDerived}
//           findings={findings}
//           areaRatings={areaRatings}
//           avgScore={avgScore}
//           imgURL={imageURLFromId}
//         />
//       </div>

//       {/* INDEX (new, minimal UI addition) */}
//       <Card className="mb-6 border-t-2 border-slate-500">
//         <SectionHeader
//           id="index"
//           title="Index"
//           subtitle="Quick navigation to sections."
//           icon={IconDoc}
//           accent="slate"
//           right={
//             <div className="flex gap-2 no-print">
//               <button
//                 onClick={onDownloadPDF}
//                 className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
//                 title="Opens print dialog → choose Save as PDF"
//               >
//                 Download PDF
//               </button>
//             </div>
//           }
//         />
//         <div className="p-5">
//           <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
//             {[
//               { label: "Cover", href: "#cover" },
//               { label: "Disclaimer", href: "#disclaimer" },
//               { label: "Distribution list", href: "#distribution" },
//               { label: "Terms & abbreviations", href: "#terms" },
//               { label: "References", href: "#references" },
//               { label: "Vessel movement", href: "#movement" },
//               { label: "Executive summary", href: "#executive" },
//               { label: "Overall rating", href: "#overallRating" },
//               { label: "Findings & impact", href: "#findingsImpact" },
//               { label: "Scorecard", href: "#scorecard" },
//               { label: "Observations", href: "#observations" },
//               { label: "Defects", href: "#defects" },
//               { label: "Photo gallery", href: "#photoGallery" },
//             ].map((item) => (
//               <a
//                 key={item.href}
//                 href={item.href}
//                 className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-800"
//               >
//                 {item.label}
//               </a>
//             ))}
//           </div>
//         </div>
//       </Card>

//       {/* COVER (kept same) */}
//       <Card className="mb-6 border-t-2 border-blue-500">
//         <SectionHeader
//           id="cover"
//           title="Vessel Inspection Report"
//           subtitle="Generated by iShip Inspection AI — review, edit, and export."
//           icon={IconDoc}
//           accent="blue"
//           right={
//             <div className="flex gap-2 no-print">
//               <button
//                 onClick={onDownloadPDF}
//                 className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
//                 title="Opens print dialog → choose Save as PDF"
//               >
//                 Download PDF
//               </button>
//             </div>
//           }
//         />
//         <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
//           <Input label="Vessel name" value={meta.vesselName} onChange={(e) => setMeta({ ...meta, vesselName: e.target.value })} />
//           <label className="block">
//             <span className="text-xs font-medium text-gray-600">Report reference</span>
//             <select
//               className="mt-1 w-full border rounded-lg p-2 bg-white text-gray-900"
//               value={meta.reportRef}
//               onChange={(e) => setMeta({ ...meta, reportRef: e.target.value })}
//             >
//               <option value="">Select report type…</option>
//               <option value="Superintendent Routine Audit">Superintendent Routine Audit</option>
//               <option value="Internal Audit">Internal Audit</option>
//               <option value="External Audit">External Audit</option>
//               <option value="Follow-up Inspection">Follow-up Inspection</option>
//               <option value="Pre-Purchase">Pre-Purchase</option>
//               <option value="Vessel Takeover Inspection">Vessel Takeover Inspection</option>
//               <option value="PSC">PSC</option>
//               <option value="Vessel Takeover">Vessel Takeover</option>
//             </select>
//           </label>

//           <Input label="Inspection date" type="date" value={meta.date} onChange={(e) => setMeta({ ...meta, date: e.target.value })} />
//           <Input label="Location / Port" value={meta.location} onChange={(e) => setMeta({ ...meta, location: e.target.value })} />
//           <Input label="Inspector (name)" value={meta.inspector} onChange={(e) => setMeta({ ...meta, inspector: e.target.value })} />
//           <Input label="Weather" value={meta.weather} onChange={(e) => setMeta({ ...meta, weather: e.target.value })} />

//           <Input label="IMO" value={meta.imo} onChange={(e) => setMeta({ ...meta, imo: e.target.value })} />
//           <Input label="Flag" value={meta.flag} onChange={(e) => setMeta({ ...meta, flag: e.target.value })} />
//           <Input label="Call sign" value={meta.callSign} onChange={(e) => setMeta({ ...meta, callSign: e.target.value })} />

//           {/* NEW: vessel particulars (added, but kept in same cover card) */}
//           <Input label="Vessel type" value={meta.vesselType || ""} onChange={(e) => setMeta({ ...meta, vesselType: e.target.value })} />
//           <Input label="Class" value={meta.vesselClass || ""} onChange={(e) => setMeta({ ...meta, vesselClass: e.target.value })} />
//           <Input label="DWT" value={meta.vesselDWT || ""} onChange={(e) => setMeta({ ...meta, vesselDWT: e.target.value })} />
//           <Input label="GT" value={meta.vesselGT || ""} onChange={(e) => setMeta({ ...meta, vesselGT: e.target.value })} />
//           <Input label="LOA" value={meta.vesselLOA || ""} onChange={(e) => setMeta({ ...meta, vesselLOA: e.target.value })} />
//           <Input label="Beam" value={meta.vesselBeam || ""} onChange={(e) => setMeta({ ...meta, vesselBeam: e.target.value })} />
//           <Input label="Year built" value={meta.vesselYearBuilt || ""} onChange={(e) => setMeta({ ...meta, vesselYearBuilt: e.target.value })} />
//           <Input
//             label="Port of registry"
//             value={meta.vesselPortOfRegistry || ""}
//             onChange={(e) => setMeta({ ...meta, vesselPortOfRegistry: e.target.value })}
//           />

//           {/* NEW: inspector particulars */}
//           <Input
//             label="Inspector company"
//             value={meta.inspectorCompany || ""}
//             onChange={(e) => setMeta({ ...meta, inspectorCompany: e.target.value })}
//           />
//           <Input
//             label="Inspector email"
//             value={meta.inspectorEmail || ""}
//             onChange={(e) => setMeta({ ...meta, inspectorEmail: e.target.value })}
//           />
//           <Input
//             label="Inspector phone"
//             value={meta.inspectorPhone || ""}
//             onChange={(e) => setMeta({ ...meta, inspectorPhone: e.target.value })}
//           />
//           <Input
//             label="Inspector credentials"
//             value={meta.inspectorCredentials || ""}
//             onChange={(e) => setMeta({ ...meta, inspectorCredentials: e.target.value })}
//           />
//         </div>
//       </Card>

//       {/* DISCLAIMER (new) */}
//       <Card className="mb-6 border-t-2 border-slate-500">
//         <SectionHeader id="disclaimer" title="Disclaimer" subtitle="Standard disclaimer for the report." icon={IconAlert} accent="slate" />
//         <div className="p-5">
//           <TextArea
//             label="Disclaimer text"
//             rows={5}
//             value={meta.disclaimerText || ""}
//             onChange={(e) => setMeta({ ...meta, disclaimerText: e.target.value })}
//           />
//         </div>
//       </Card>

//       {/* DISTRIBUTION LIST (new) */}
//       <Card className="mb-6 border-t-2 border-slate-500">
//         <SectionHeader id="distribution" title="Distribution list" subtitle="Who will receive this report." icon={IconUsers} accent="slate" />
//         <div className="p-5">
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm border">
//               <thead className="bg-gray-50 text-gray-600">
//                 <tr>
//                   <th className="px-3 py-2 text-left">Role</th>
//                   <th className="px-3 py-2 text-left">Name</th>
//                   <th className="px-3 py-2 text-left">Email</th>
//                   <th className="px-3 py-2 text-left w-20">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {(Array.isArray(meta.distributionList) ? meta.distributionList : []).map((row, index) => (
//                   <tr key={index} className="border-t">
//                     <td className="px-3 py-2">
//                       <input
//                         className="w-full border rounded-lg p-2 bg-white"
//                         value={row.role || ""}
//                         onChange={(e) => {
//                           const next = [...meta.distributionList];
//                           next[index] = { ...next[index], role: e.target.value };
//                           setMeta({ ...meta, distributionList: next });
//                         }}
//                       />
//                     </td>
//                     <td className="px-3 py-2">
//                       <input
//                         className="w-full border rounded-lg p-2 bg-white"
//                         value={row.name || ""}
//                         onChange={(e) => {
//                           const next = [...meta.distributionList];
//                           next[index] = { ...next[index], name: e.target.value };
//                           setMeta({ ...meta, distributionList: next });
//                         }}
//                       />
//                     </td>
//                     <td className="px-3 py-2">
//                       <input
//                         className="w-full border rounded-lg p-2 bg-white"
//                         value={row.email || ""}
//                         onChange={(e) => {
//                           const next = [...meta.distributionList];
//                           next[index] = { ...next[index], email: e.target.value };
//                           setMeta({ ...meta, distributionList: next });
//                         }}
//                       />
//                     </td>
//                     <td className="px-3 py-2">
//                       <button
//                         type="button"
//                         className="text-xs px-3 py-1 rounded-lg border text-red-700 hover:bg-red-50"
//                         onClick={() => {
//                           const next = [...meta.distributionList];
//                           next.splice(index, 1);
//                           setMeta({ ...meta, distributionList: next });
//                         }}
//                       >
//                         Remove
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//                 <tr className="border-t bg-gray-50">
//                   <td className="px-3 py-2" colSpan={4}>
//                     <button
//                       type="button"
//                       className="text-xs px-3 py-2 rounded-lg border hover:bg-white"
//                       onClick={() => {
//                         const next = Array.isArray(meta.distributionList) ? [...meta.distributionList] : [];
//                         next.push({ role: "", name: "", email: "" });
//                         setMeta({ ...meta, distributionList: next });
//                       }}
//                     >
//                       + Add recipient
//                     </button>
//                   </td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//           <p className="mt-2 text-[11px] text-gray-500">Tip: keep emails optional if you don’t want them printed.</p>
//         </div>
//       </Card>

//       {/* TERMS & ABBREVIATIONS (new) */}
//       <Card className="mb-6 border-t-2 border-slate-500">
//         <SectionHeader id="terms" title="Terms & abbreviations" subtitle="Terms definitions + common abbreviations." icon={IconClipboard} accent="slate" />
//         <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
//           <TextArea
//             label="Terms"
//             rows={7}
//             value={meta.termsText || ""}
//             onChange={(e) => setMeta({ ...meta, termsText: e.target.value })}
//           />
//           <TextArea
//             label="Abbreviations (one per line)"
//             rows={7}
//             value={meta.abbreviationsText || ""}
//             onChange={(e) => setMeta({ ...meta, abbreviationsText: e.target.value })}
//           />
//         </div>
//       </Card>

//       {/* REFERENCES (new) */}
//       <Card className="mb-6 border-t-2 border-slate-500">
//         <SectionHeader id="references" title="References" subtitle="List any relevant references / standards (one per line)." icon={IconDoc} accent="slate" />
//         <div className="p-5">
//           <TextArea
//             label="References"
//             rows={5}
//             value={meta.referencesText || ""}
//             onChange={(e) => setMeta({ ...meta, referencesText: e.target.value })}
//           />
//         </div>
//       </Card>

//       {/* VESSEL MOVEMENT (new) */}
//       <Card className="mb-6 border-t-2 border-violet-500">
//         <SectionHeader id="movement" title="Vessel movement" subtitle="Movement & voyage details." icon={IconDoc} accent="violet" />
//         <div className="p-5 grid md:grid-cols-2 gap-4">
//           <Input label="Last port" value={meta.lastPort || ""} onChange={(e) => setMeta({ ...meta, lastPort: e.target.value })} />
//           <Input label="Current port" value={meta.currentPort || ""} onChange={(e) => setMeta({ ...meta, currentPort: e.target.value })} />
//           <Input label="Next port" value={meta.nextPort || ""} onChange={(e) => setMeta({ ...meta, nextPort: e.target.value })} />
//           <Input label="Berth / Anchorage" value={meta.berthOrAnchorage || ""} onChange={(e) => setMeta({ ...meta, berthOrAnchorage: e.target.value })} />
//           <Input label="ETA" value={meta.eta || ""} onChange={(e) => setMeta({ ...meta, eta: e.target.value })} />
//           <Input label="ETD" value={meta.etd || ""} onChange={(e) => setMeta({ ...meta, etd: e.target.value })} />
//           <div className="md:col-span-2">
//             <TextArea label="Voyage notes" rows={3} value={meta.voyageNotes || ""} onChange={(e) => setMeta({ ...meta, voyageNotes: e.target.value })} />
//           </div>
//         </div>
//       </Card>

//       {/* EXECUTIVE SUMMARY (kept same) */}
//       <Card className="mb-6 border-t-2 border-blue-500">
//         <SectionHeader
//           id="executive"
//           title="Executive summary"
//           subtitle="One-paragraph overview for busy readers."
//           icon={IconDoc}
//           accent="blue"
//           right={
//             <button
//               onClick={generateSummary}
//               disabled={genBusy}
//               className="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 disabled:opacity-50 no-print"
//               title="Auto-generate from findings"
//             >
//               {genBusy ? "Generating…" : "Auto-generate"}
//             </button>
//           }
//         />
//         <div className="p-5">
//           <div className="grid md:grid-cols-3 gap-4">
//             <KeyMetric label="Fire hazards" value={counts.fire_hazard_count ?? 0} tone={(counts.fire_hazard_count ?? 0) > 0 ? "red" : "green"} />
//             <KeyMetric label="Trip / fall" value={counts.trip_fall_count ?? 0} tone={(counts.trip_fall_count ?? 0) > 0 ? "amber" : "green"} />
//             <KeyMetric label="Satisfactory" value={counts.none_count ?? 0} tone="green" />
//           </div>

//           <TextArea
//             label="Summary"
//             className="mt-4"
//             rows={4}
//             value={meta.summaryBlurb}
//             onChange={(e) => setMeta({ ...meta, summaryBlurb: e.target.value })}
//           />

//           <div id="overallRating" className="mt-4 p-4 rounded-lg border bg-gray-50">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-xs font-medium text-gray-600">Overall Rating</p>
//                 <p className="text-lg font-semibold text-gray-900">{meta.overallRating || "—"}</p>
//                 {meta.score !== null ? <p className="text-sm text-gray-500">Score: {meta.score} / 100</p> : null}
//               </div>
//               <div className="flex flex-col text-xs text-gray-600">
//                 <span className="mb-1">Adjust manually:</span>
//                 <select
//                   value={meta.overallRating}
//                   onChange={(e) => setMeta({ ...meta, overallRating: e.target.value })}
//                   className="border rounded p-1 bg-white text-gray-900"
//                 >
//                   <option value="Excellent">Excellent</option>
//                   <option value="Good">Good</option>
//                   <option value="Satisfactory">Satisfactory</option>
//                   <option value="Fair">Fair</option>
//                   <option value="Poor">Poor</option>
//                 </select>
//               </div>
//             </div>
//           </div>
//         </div>
//       </Card>

//       {/* INSPECTION DETAILS (kept same) */}
//       <Card className="mb-6 border-t-2 border-cyan-500">
//         <SectionHeader id="details" title="Inspection details" icon={IconClipboard} accent="cyan" />
//         <div className="p-5 grid md:grid-cols-2 gap-4">
//           <TextArea label="Scope" rows={3} value={meta.scope} onChange={(e) => setMeta({ ...meta, scope: e.target.value })} />
//           <TextArea label="Methodology" rows={3} value={meta.methodology} onChange={(e) => setMeta({ ...meta, methodology: e.target.value })} />
//           <TextArea label="Limitations" rows={3} value={meta.limitations} onChange={(e) => setMeta({ ...meta, limitations: e.target.value })} />
//         </div>
//       </Card>

//       {/* CREW (kept same) */}
//       <Card className="mb-6 border-t-2 border-emerald-500">
//         <SectionHeader id="crew" title="Crew & manning" icon={IconUsers} accent="emerald" />
//         <div className="p-5 grid md:grid-cols-3 gap-4">
//           <Input label="Total crew" value={meta.crewTotal || ""} onChange={(e) => setMeta({ ...meta, crewTotal: e.target.value })} />
//           <Input label="Officers" value={meta.officers || ""} onChange={(e) => setMeta({ ...meta, officers: e.target.value })} />
//           <Input label="Ratings" value={meta.ratings || ""} onChange={(e) => setMeta({ ...meta, ratings: e.target.value })} />
//         </div>
//       </Card>

//       {/* FINDINGS AT A GLANCE (kept same) */}
//       <Card className="mb-6 border-t-2 border-amber-500">
//         <SectionHeader
//           id="kpis"
//           title="Findings at a glance"
//           icon={IconAlert}
//           accent="amber"
//           right={
//             <button onClick={() => setEditFindings((e) => !e)} className="px-3 py-1 rounded-lg border text-gray-700 hover:bg-gray-50">
//               {editFindings ? "Done" : "Edit"}
//             </button>
//           }
//         />
//         <div className="p-5 grid md:grid-cols-5 gap-4">
//           {!editFindings ? (
//             <>
//               <KeyMetric label="Fire hazards" value={findings.fire} tone={findings.fire ? "red" : "green"} />
//               <KeyMetric label="Trip / fall" value={findings.trip} tone={findings.trip ? "amber" : "green"} />
//               <KeyMetric label="Rust" value={findings.rust} tone={findings.rust ? "amber" : "green"} />
//               <KeyMetric label="Attention" value={findings.attention} tone={findings.attention ? "blue" : "green"} />
//               <KeyMetric label="Missing timestamps" value={findings.missingTs} tone={findings.missingTs ? "violet" : "green"} />
//             </>
//           ) : (
//             <>
//               <Input label="Fire hazards" type="number" value={findings.fire} onChange={(e) => setFindings((f) => ({ ...f, fire: Number(e.target.value || 0) }))} />
//               <Input label="Trip / fall" type="number" value={findings.trip} onChange={(e) => setFindings((f) => ({ ...f, trip: Number(e.target.value || 0) }))} />
//               <Input label="Rust" type="number" value={findings.rust} onChange={(e) => setFindings((f) => ({ ...f, rust: Number(e.target.value || 0) }))} />
//               <Input label="Attention" type="number" value={findings.attention} onChange={(e) => setFindings((f) => ({ ...f, attention: Number(e.target.value || 0) }))} />
//               <Input label="Missing timestamps" type="number" value={findings.missingTs} onChange={(e) => setFindings((f) => ({ ...f, missingTs: Number(e.target.value || 0) }))} />
//             </>
//           )}
//         </div>
//       </Card>

//       {/* SUMMARY OF FINDINGS & COMMERCIAL IMPACT (new) */}
//       <Card className="mb-6 border-t-2 border-amber-500">
//         <SectionHeader
//           id="findingsImpact"
//           title="Summary of findings & commercial impact"
//           subtitle="Short narrative summary for stakeholders."
//           icon={IconAlert}
//           accent="amber"
//         />
//         <div className="p-5">
//           <TextArea
//             label="Commercial impact (editable)"
//             rows={4}
//             value={meta.commercialImpactText || commercialImpactText}
//             onChange={(e) => setMeta({ ...meta, commercialImpactText: e.target.value })}
//           />
//           <p className="mt-2 text-[11px] text-gray-500">
//             Tip: If you leave this unchanged, it will follow the current findings counts.
//           </p>
//         </div>
//       </Card>

//       {/* SCORECARD (kept same) */}
//       <Card className="mb-6 border-t-2 border-green-500">
//         <SectionHeader id="scorecard" title="Section-wise Scorecard" subtitle="Rate each vessel area based on observations." icon={IconCheck} accent="emerald" />
//         <div className="p-5 overflow-x-auto bg-gray-50 rounded-b-xl">
//           <table className="min-w-full text-sm border">
//             <thead className="bg-gray-50 text-gray-600">
//               <tr>
//                 <th className="px-3 py-2 text-left">Section / Area</th>
//                 <th className="px-3 py-2 text-left">Score</th>
//                 <th className="px-3 py-2 text-left">Rating</th>
//                 <th className="px-3 py-2 text-left">Remarks</th>
//               </tr>
//             </thead>
//             <tbody>
//               {Object.entries(areaRatings).map(([area, data]) => (
//                 <tr key={area} className="border-t">
//                   <td className="px-3 py-2 font-medium text-gray-900">{area}</td>
//                   <td className="px-3 py-2">
//                     <input
//                       type="number"
//                       value={data.score}
//                       onChange={(e) => setAreaRatings((prev) => ({ ...prev, [area]: { ...prev[area], score: Number(e.target.value || 0) } }))}
//                       className="w-20 border rounded-lg p-2 bg-white text-gray-900 text-center"
//                     />
//                   </td>
//                   <td className="px-3 py-2">
//                     <select
//                       value={data.rating}
//                       onChange={(e) => setAreaRatings((prev) => ({ ...prev, [area]: { ...prev[area], rating: e.target.value } }))}
//                       className="border rounded-lg p-2 bg-white text-gray-900"
//                     >
//                       <option>Excellent</option>
//                       <option>Good</option>
//                       <option>Satisfactory</option>
//                       <option>Fair</option>
//                       <option>Poor</option>
//                     </select>
//                   </td>
//                   <td className="px-3 py-2">
//                     <input
//                       type="text"
//                       value={data.remarks}
//                       onChange={(e) => setAreaRatings((prev) => ({ ...prev, [area]: { ...prev[area], remarks: e.target.value } }))}
//                       className="w-full border rounded-lg p-2 bg-white text-gray-900"
//                       placeholder="Remarks"
//                     />
//                   </td>
//                 </tr>
//               ))}
//               <tr className="bg-gray-50 font-medium border-t">
//                 <td className="px-3 py-2 text-gray-900">Average Score</td>
//                 <td className="px-3 py-2 text-blue-700">{avgScore}</td>
//                 <td className="px-3 py-2 text-gray-600" colSpan="2">
//                   Overall vessel section performance summary
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </Card>

//       {/* OBSERVATIONS (kept same, just minor safety) */}
//       <Card className="mb-6 border-t-2 border-blue-500">
//         <SectionHeader
//           id="observations"
//           title="Observations"
//           subtitle="Filter & sort findings. Click an image to enlarge."
//           icon={IconClipboard}
//           accent="blue"
//           right={
//             <div className="hidden md:flex items-center gap-2 pr-3">
//               <button
//                 type="button"
//                 onClick={() => setObsView("grid")}
//                 className={`px-3 py-1 rounded-lg border ${
//                   obsView === "grid" ? "bg-blue-600 text-white border-blue-600" : "text-gray-700 hover:bg-gray-50"
//                 }`}
//               >
//                 Grid
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setObsView("list")}
//                 className={`px-3 py-1 rounded-lg border ${
//                   obsView === "list" ? "bg-blue-600 text-white border-blue-600" : "text-gray-700 hover:bg-gray-50"
//                 }`}
//               >
//                 List
//               </button>
//             </div>
//           }
//         />

//         <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
//           <label className="block">
//             <span className="text-xs font-medium text-gray-600">Condition</span>
//             <select
//               value={obsFilterCond}
//               onChange={(e) => setObsFilterCond(e.target.value)}
//               className="mt-1 w-full border rounded-lg p-2 bg-white"
//             >
//               <option value="">All</option>
//               <option value="fire_hazard">Fire hazard</option>
//               <option value="trip_fall">Trip / fall</option>
//               <option value="rust">Rust</option>
//               <option value="attention">Attention</option>
//               <option value="none">Satisfactory</option>
//             </select>
//           </label>

//           <label className="block md:col-span-2">
//             <span className="text-xs font-medium text-gray-600">Search</span>
//             <input
//               value={obsSearch}
//               onChange={(e) => setObsSearch(e.target.value)}
//               placeholder="Search location or comment…"
//               className="mt-1 w-full border rounded-lg p-2 bg-white"
//             />
//           </label>

//           <label className="block">
//             <span className="text-xs font-medium text-gray-600">Sort by</span>
//             <div className="flex gap-2 mt-1">
//               <select
//                 value={obsSort.key}
//                 onChange={(e) => setObsSort((s) => ({ ...s, key: e.target.value }))}
//                 className="border rounded-lg p-2 bg-white w-full"
//               >
//                 <option value="index">#</option>
//                 <option value="condition">Condition</option>
//                 <option value="location">Location</option>
//               </select>
//               <select
//                 value={obsSort.dir}
//                 onChange={(e) => setObsSort((s) => ({ ...s, dir: e.target.value }))}
//                 className="border rounded-lg p-2 bg-white"
//               >
//                 <option value="asc">Asc</option>
//                 <option value="desc">Desc</option>
//               </select>
//             </div>
//           </label>
//         </div>

//         <div className="px-5 pb-5">
//           {obsFilteredSorted.length === 0 ? (
//             <div className="text-gray-500">No observations match the filters.</div>
//           ) : obsView === "grid" ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//               {obsFilteredSorted.map((row, idx) => {
//                 const rawItem = row.raw;
//                 return (
//                   <div key={rawItem.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
//                     <div className="relative">
//                       <button
//                         type="button"
//                         onClick={() => setSelectedPhoto(rawItem)}
//                         className="block w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         title="Click to enlarge"
//                       >
//                         <img
//                           src={imageURLFromId(rawItem.id)}
//                           alt={rawItem.id}
//                           className="w-full h-auto max-h-[70vh] object-contain"
//                           onError={(e) => {
//                             e.currentTarget.src = "/placeholder.png";
//                             e.currentTarget.onerror = null;
//                           }}
//                         />
//                       </button>
//                       <div className="absolute top-3 left-3">
//                         <Tag value={row.condition} />
//                       </div>
//                     </div>

//                     <div className="p-4 space-y-3">
//                       <div className="text-sm font-medium text-gray-900">
//                         {rawItem.location ? `Location: ${rawItem.location}` : `Observation #${row.index}`}
//                       </div>

//                       <div>
//                         <div className="text-xs font-medium text-gray-600 mb-1">Location</div>
//                         <input
//                           className="w-full border rounded-lg p-2 bg-white text-gray-900"
//                           defaultValue={rawItem.location || ""}
//                           placeholder="e.g., Engine Room / Main Deck / Bow"
//                           onBlur={(e) => persistRow(row.sourceIndex, { location: e.target.value })}
//                         />
//                       </div>

//                       <div>
//                         <div className="text-xs font-medium text-gray-600 mb-1">Comment</div>
//                         <textarea
//                           className="w-full border rounded-lg p-2 bg-white text-gray-900 min-h-[84px]"
//                           defaultValue={rawItem.comment || rawItem.comments || ""}
//                           onBlur={(e) => persistRow(row.sourceIndex, { comment: e.target.value })}
//                         />
//                       </div>

//                       <div>
//                         <div className="text-xs font-medium text-gray-600 mb-1">
//                           Recommendations <span className="text-gray-400">(use ; between items)</span>
//                         </div>
//                         {getNormalizedRecommendationsArray(rawItem).length > 0 ? (
//                           <textarea
//                             className="w-full border rounded-lg p-2 bg-white text-gray-900 min-h-[84px]"
//                             defaultValue={getNormalizedRecommendationsArray(rawItem).join("; ")}
//                             onBlur={(e) =>
//                               persistRow(row.sourceIndex, { recommendations_high_severity_only: e.target.value })
//                             }
//                           />
//                         ) : (
//                           <div className="text-xs text-gray-400">—</div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full text-sm">
//                 <thead className="bg-gray-50 text-gray-600 border-b">
//                   <tr>
//                     <th className="text-left font-medium px-3 py-2 w-10">#</th>
//                     <th className="text-left font-medium px-3 py-2 w-28">Photo</th>
//                     <th className="text-left font-medium px-3 py-2 w-40">Location</th>
//                     <th className="text-left font-medium px-3 py-2 w-32">Condition</th>
//                     <th className="text-left font-medium px-3 py-2">Comment</th>
//                     <th className="text-left font-medium px-3 py-2 w-24">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {obsFilteredSorted.map((row) => (
//                     <tr key={row.id} className="border-b align-top">
//                       <td className="px-3 py-2 text-gray-500">{row.index}</td>
//                       <td className="px-3 py-2">
//                         <button
//                           type="button"
//                           className="w-28 h-20 rounded-lg border bg-gray-100 overflow-hidden p-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                           onClick={() => setSelectedPhoto(row.raw)}
//                         >
//                           <img
//                             src={imageURLFromId(row.id)}
//                             alt={row.id}
//                             className="w-full h-full object-contain"
//                             onError={(e) => {
//                               e.currentTarget.src = "/placeholder.png";
//                               e.currentTarget.onerror = null;
//                             }}
//                           />
//                         </button>
//                       </td>
//                       <td className="px-3 py-2">{row.location || "—"}</td>
//                       <td className="px-3 py-2">
//                         <Tag value={row.condition} />
//                       </td>
//                       <td className="px-3 py-2 text-gray-700">
//                         <div className="line-clamp-3">{(row.raw.comment || row.raw.comments || "").trim() || "—"}</div>
//                       </td>
//                       <td className="px-3 py-2">
//                         <button
//                           type="button"
//                           onClick={() => setSelectedPhoto(row.raw)}
//                           className="text-xs px-3 py-1 rounded-lg border text-gray-700 hover:bg-gray-50"
//                         >
//                           View
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </Card>

//       {/* DEFECTS (kept same card-grid design) */}
//       <Card className="mb-6 border-t-2 border-rose-500">
//         <SectionHeader
//           id="defects"
//           title="Defects & non-conformities"
//           subtitle="Auto-prepared from observations. You can add/edit/delete."
//           icon={IconAlert}
//           accent="rose"
//           right={
//             <button className="px-3 py-1 rounded-lg border text-gray-700 hover:bg-gray-50" onClick={() => setAddOpen(true)}>
//               + Add Defect
//             </button>
//           }
//         />

//         <div className="p-4">
//           {hazardRowsDerived.length === 0 ? (
//             <div className="px-3 py-6 text-center text-gray-500 border rounded-lg bg-white">No defects / non-conformities.</div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//               {hazardRowsDerived.map((row, i) => {
//                 const photoId = row.photoId || row.id;
//                 const photo = photoId ? perImage.find((x) => x.id === photoId) : null;

//                 return (
//                   <div key={row.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
//                     <div className="relative">
//                       <button
//                         type="button"
//                         onClick={() => photo && setSelectedPhoto(photo)}
//                         className="block w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         title="Click to enlarge"
//                       >
//                         <img
//                           src={photoId ? imageURLFromId(photoId) : "/placeholder.png"}
//                           alt={photoId || `defect-${i + 1}`}
//                           className="w-full h-auto max-h-[70vh] object-contain bg-gray-50"
//                           onError={(e) => {
//                             e.currentTarget.src = "/placeholder.png";
//                             e.currentTarget.onerror = null;
//                           }}
//                         />
//                       </button>

//                       <div className="absolute top-3 left-3">
//                         <Tag value={row.condition || "attention"} />
//                       </div>

//                       <button
//                         className="absolute top-3 right-3 text-xs w-8 h-8 inline-flex items-center justify-center rounded-md border text-red-700 bg-white/90 hover:bg-red-50"
//                         onClick={() => deleteDefect(row.id, !!row.manual)}
//                         title="Delete"
//                         aria-label="Delete"
//                         type="button"
//                       >
//                         ×
//                       </button>
//                     </div>

//                     <div className="p-4 space-y-3">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                         <label className="block">
//                           <span className="text-xs font-medium text-gray-600">Area</span>
//                           <input
//                             className="mt-1 w-full border rounded-lg p-2 bg-white text-gray-900"
//                             value={row.area || ""}
//                             onChange={(e) => updateDefect(row.id, { area: e.target.value })}
//                             placeholder="Area"
//                           />
//                         </label>

//                         <label className="block">
//                           <span className="text-xs font-medium text-gray-600">Condition</span>
//                           <select
//                             className="mt-1 w-full border rounded-lg p-2 bg-white text-gray-900"
//                             value={row.condition || "attention"}
//                             onChange={(e) => updateDefect(row.id, { condition: e.target.value })}
//                           >
//                             <option value="fire_hazard">Fire hazard</option>
//                             <option value="trip_fall">Trip / fall</option>
//                             <option value="rust">Rust</option>
//                             <option value="attention">Attention</option>
//                             <option value="none">Satisfactory</option>
//                           </select>
//                         </label>
//                       </div>

//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                         <label className="block">
//                           <span className="text-xs font-medium text-gray-600">Assigned</span>
//                           <input
//                             className="mt-1 w-full border rounded-lg p-2 bg-white text-gray-900"
//                             value={row.assignedTo || ""}
//                             onChange={(e) => updateDefect(row.id, { assignedTo: e.target.value })}
//                             placeholder="Name"
//                           />
//                         </label>
//                         <label className="block">
//                           <span className="text-xs font-medium text-gray-600">Deadline</span>
//                           <input
//                             type="date"
//                             className="mt-1 w-full border rounded-lg p-2 bg-white text-gray-900"
//                             value={row.deadline || ""}
//                             onChange={(e) => updateDefect(row.id, { deadline: e.target.value })}
//                           />
//                         </label>
//                       </div>

//                       <div>
//                         <div className="text-xs font-medium text-gray-600 mb-1">Recommendations</div>
//                         {row.manual ? (
//                           <textarea
//                             className="w-full border rounded-lg p-2 bg-white text-gray-900 min-h-[84px]"
//                             value={row.combined || ""}
//                             onChange={(e) => updateDefect(row.id, { combined: e.target.value })}
//                             placeholder="Recommendations"
//                           />
//                         ) : (
//                           <div className="text-sm text-gray-800 whitespace-pre-wrap">{row.recommendations ? row.recommendations : "—"}</div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           <p className="mt-2 text-[11px] text-gray-500">Tip: click a photo thumbnail to preview. Comments remain available in the photo modal.</p>
//         </div>
//       </Card>

//       {/* PHOTO GALLERY (new, minimal design: uses your existing photo card style) */}
//       <Card className="mb-6 border-t-2 border-blue-500">
//         <SectionHeader
//           id="photoGallery"
//           title="Photo gallery"
//           subtitle="Grouped by location (uses your editable location field)."
//           icon={IconDoc}
//           accent="blue"
//         />
//         <div className="p-5 space-y-6">
//           {photoGalleryGroups.map((group) => (
//             <div key={group.locationName} className="rounded-xl border bg-white overflow-hidden">
//               <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
//                 <div className="font-medium text-gray-900">{group.locationName}</div>
//                 <div className="text-xs text-gray-500">{group.items.length} photo(s)</div>
//               </div>
//               <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
//                 {group.items.map((imageItem) => (
//                   <button
//                     key={imageItem.id}
//                     type="button"
//                     className="rounded-lg border bg-gray-50 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     onClick={() => setSelectedPhoto(imageItem)}
//                     title="Click to view"
//                   >
//                     <img
//                       src={imageURLFromId(imageItem.id)}
//                       alt={imageItem.id}
//                       className="w-full h-28 object-contain"
//                       onError={(e) => {
//                         e.currentTarget.src = "/placeholder.png";
//                         e.currentTarget.onerror = null;
//                       }}
//                     />
//                     <div className="px-2 py-2 flex items-center justify-between gap-2 bg-white border-t">
//                       <span className="text-xs text-gray-600">#{imageItem.id}</span>
//                       <Tag value={resolveEffectiveCondition(imageItem)} />
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       </Card>

//       {/* Photo modal (kept same) */}
//       {selectedPhoto ? (
//         <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
//           <div className="bg-white rounded-xl max-w-4xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between px-4 py-3 border-b">
//               <div className="text-sm font-semibold text-gray-900">{selectedPhoto.id}</div>
//               <button className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50" onClick={() => setSelectedPhoto(null)}>
//                 Close
//               </button>
//             </div>
//             <div className="p-4">
//               <img
//                 src={imageURLFromId(selectedPhoto.id)}
//                 alt={selectedPhoto.id}
//                 className="w-full max-h-[70vh] object-contain rounded-lg bg-gray-50"
//                 onError={(e) => {
//                   e.currentTarget.src = "/placeholder.png";
//                   e.currentTarget.onerror = null;
//                 }}
//               />
//               <div className="mt-3 text-sm text-gray-700">
//                 <div className="mt-2">
//                   <div className="text-xs font-medium text-gray-600 mb-1">Location</div>
//                   <input
//                     className="w-full border rounded-lg p-2 bg-white text-gray-900"
//                     defaultValue={selectedPhoto.location || ""}
//                     placeholder="Add location for this photo"
//                     onBlur={(e) => {
//                       const newLocationValue = e.target.value;
//                       const idx = perImage.findIndex((x) => x.id === selectedPhoto.id);
//                       if (idx >= 0) persistRow(idx, { location: newLocationValue });
//                       setSelectedPhoto((p) => ({ ...p, location: newLocationValue }));
//                     }}
//                   />
//                 </div>
//                 <div className="mt-2">
//                   <b>Condition:</b> {conditionLabel(resolveEffectiveCondition(selectedPhoto))}
//                 </div>
//                 {(selectedPhoto.comment || selectedPhoto.comments) ? (
//                   <div className="mt-2 whitespace-pre-wrap">
//                     <b>Comment:</b> {(selectedPhoto.comment || selectedPhoto.comments).toString()}
//                   </div>
//                 ) : null}
//               </div>
//             </div>
//           </div>
//         </div>
//       ) : null}

//       {/* Add defect modal (kept same) */}
//       {addOpen ? (
//         <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setAddOpen(false)}>
//           <div className="bg-white rounded-xl max-w-xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between px-4 py-3 border-b">
//               <div className="text-sm font-semibold text-gray-900">Add Defect</div>
//               <button className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50" onClick={() => setAddOpen(false)}>
//                 Close
//               </button>
//             </div>

//             <div className="p-4 space-y-3">
//               <Input label="Photo ID (optional)" value={addForm.photoId} onChange={(e) => setAddForm((p) => ({ ...p, photoId: e.target.value }))} />
//               <Input label="Area" value={addForm.area} onChange={(e) => setAddForm((p) => ({ ...p, area: e.target.value }))} />
//               <Input label="Assigned To" value={addForm.assignedTo} onChange={(e) => setAddForm((p) => ({ ...p, assignedTo: e.target.value }))} />

//               <label className="block">
//                 <span className="text-xs font-medium text-gray-600">Condition</span>
//                 <select
//                   className="mt-1 w-full border rounded-lg p-2 bg-white"
//                   value={addForm.condition}
//                   onChange={(e) => setAddForm((p) => ({ ...p, condition: e.target.value }))}
//                 >
//                   <option value="fire_hazard">Fire hazard</option>
//                   <option value="trip_fall">Trip / fall</option>
//                   <option value="rust">Rust</option>
//                   <option value="attention">Attention</option>
//                   <option value="none">Satisfactory</option>
//                 </select>
//               </label>

//               <Input label="Deadline" type="date" value={addForm.deadline} onChange={(e) => setAddForm((p) => ({ ...p, deadline: e.target.value }))} />
//               <TextArea label="Details" rows={4} value={addForm.combined} onChange={(e) => setAddForm((p) => ({ ...p, combined: e.target.value }))} />

//               <div className="flex gap-2 justify-end pt-2">
//                 <button className="px-4 py-2 rounded-lg border hover:bg-gray-50" onClick={() => setAddOpen(false)}>
//                   Cancel
//                 </button>
//                 <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={onSaveAdd}>
//                   Save
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       ) : null}
//     </div>
//   );
// }
