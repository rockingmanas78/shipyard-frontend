import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import { useReactToPrint } from "react-to-print";
import PrintReport from "./PrintReport";

/** Safe JSON parse */
function safeJSONParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
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
  default: "border-t-slate-300",
};
const iconAccent = {
  blue: "bg-blue-100 text-blue-600",
  cyan: "bg-cyan-100 text-cyan-600",
  violet: "bg-violet-100 text-violet-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  rose: "bg-rose-100 text-rose-600",
  default: "bg-slate-100 text-slate-600",
};

const SectionHeader = ({ id, title, subtitle, right, icon: Icon, accent = "default" }) => (
  <div
    id={id}
    className={`px-5 py-4 border-b border-t ${sectionAccent[accent] || sectionAccent.default} rounded-t-xl flex items-center justify-between`}
  >
    <div className="flex items-center gap-3">
      {Icon ? (
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${iconAccent[accent] || iconAccent.default}`}>
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
    <input
      {...props}
      className={`mt-1 w-full border rounded-lg p-2 bg-white text-gray-900 placeholder-gray-400 ${className}`}
    />
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
        tone === "red" ? "text-red-700" : tone === "amber" ? "text-amber-700" : tone === "green" ? "text-emerald-700" : "text-gray-900"
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
  // Compute an "effective" condition for UI/PDF consistency.
  // - Keeps your response contract unchanged (still reads it.condition)
  // - Adds resilience when backend maps unsupported hazards to "none"
  // - Handles: rust tag, high severity without recs, recs stored in `recommendations`
  const getNormalizedCondition = (item) =>
    ((item?.condition ?? item?.condition_type ?? "none") + "").toString();

  const getNormalizedComment = (item) =>
    ((item?.comment ?? item?.comments ?? "") + "").toString();

  const getNormalizedRecommendationsArray = (item) => {
    // Prefer your existing field; fallback to OpenAI native `recommendations`
    if (Array.isArray(item?.recommendations_high_severity_only)) return item.recommendations_high_severity_only;
    if (Array.isArray(item?.recommendations)) return item.recommendations;
    // If something stored as a string (user edits), split it safely
    if (typeof item?.recommendations_high_severity_only === "string") {
      return item.recommendations_high_severity_only
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const resolveEffectiveCondition = (perImageItem) => {
    const rawCondition = getNormalizedCondition(perImageItem);
    if (rawCondition !== "none") return rawCondition;

    const tagsObject = perImageItem?.tags || {};
    const hasRustStainsTag = Boolean(tagsObject?.rust_stains);

    const recommendationsHighSeverityOnly = Array.isArray(perImageItem?.recommendations_high_severity_only)
      ? perImageItem.recommendations_high_severity_only : [];
    const hasHighSeverityRecommendations = recommendationsHighSeverityOnly.length > 0;

    // Some backends store recs in `recommendations` (OpenAI native) instead of `_high_severity_only`
    const fallbackRecommendations = Array.isArray(perImageItem?.recommendations) ? perImageItem.recommendations : [];
    const hasAnyRecommendations = fallbackRecommendations.length > 0;

    // Optional fields (won't break if missing)
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

export default function Summary({ model = "openai" }) {
  // ---- baseURL image helper
  const imgURL = (id) => `${api.defaults.baseURL}/uploads/${encodeURIComponent(id)}`;

  // ---- load localStorage safely
  const [storageVersion, setStorageVersion] = useState(0);
  // const stored = safeJSONParse(localStorage.getItem("iship_results") || "{}", {});
  // const modelBucket = stored?.results?.[model] || {};
  // const results = modelBucket && typeof modelBucket === "object" ? modelBucket : {};
   const results = useMemo(() => {
     const stored = safeJSONParse(localStorage.getItem("iship_results") || "{}", {});
     const modelBucket = stored?.results?.[model] || {};
     return modelBucket && typeof modelBucket === "object" ? modelBucket : {};
   }, [model, storageVersion]);

  const perImage = Array.isArray(results?.per_image) ? results.per_image : [];
  const counts = results?.batch_summary || { fire_hazard_count: 0, trip_fall_count: 0, none_count: 0 };

  // ---- meta
  const [meta, setMeta] = useState({
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
  });

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
      const hasRecs = (it.recommendations_high_severity_only || []).length > 0;
      const rust = !!it.tags?.rust_stains;
      const condition =
        it.condition === "none" && rust ? "rust" : it.condition === "none" && hasRecs ? "attention" : it.condition || "none";

      // const text = [it.id, it.location, it.comment].filter(Boolean).join(" ").toLowerCase();
      // return {
      //   raw: it,
      //   index: i + 1,
      //   id: it.id,
      //   location: it.location || "",
      //   condition,
      //   text,
      // };
      const text = [it.id, it.location, getNormalizedComment(it)].filter(Boolean).join(" ").toLowerCase();
       return {
        raw: it,
        index: i + 1,
        sourceIndex: i, // IMPORTANT: original index in perImage for persistence
        id: it.id,
        location: it.location || "",
        condition: resolveEffectiveCondition(it),
        text,
      };
    });
  }, [perImage]);

  const getRowRecommendationsText = (row) => {
    if (!row) return "";
    if (row.manual) return (row.combined || "").toString();
    return (row.recommendations || "").toString();
  };


  const obsFilteredSorted = useMemo(() => {
    let list = obsRows;

    if (obsFilterCond) list = list.filter((r) => r.condition === obsFilterCond);
    if (obsSearch.trim()) {
      const q = obsSearch.trim().toLowerCase();
      list = list.filter((r) => r.text.includes(q));
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
        // const hasRecs = (it.recommendations_high_severity_only || []).length > 0;
        const rust = !!it.tags?.rust_stains;
        //const effectiveCondition = it.condition === "none" && rust ? "rust" : it.condition === "none" && hasRecs ? "attention" : it.condition;
        const effectiveCondition = resolveEffectiveCondition(it);

        // if (effectiveCondition === "none" && !hasRecs) return null;
        // if (effectiveCondition === "none") return null;
        // const effectiveCondition = resolveEffectiveCondition(it);
        const recsArray = getNormalizedRecommendationsArray(it);
        const hasRecs = recsArray.length > 0;
        if (effectiveCondition === "none" && !hasRecs) return null;
        const recs = recsArray.join("; ") || "";

        const overrides = getDefect(it.id);
        if (overrides?.hidden) return null;

        // const recs = (it.recommendations_high_severity_only || []).join("; ") || "";
        return {
          id: it.id,
          photoId: it.id,
          index: i + 1,
          area: it.location || "—",
          condition: effectiveCondition,
          // comment: it.comment || "",
          comment: getNormalizedComment(it),
          recommendations: recs,
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
      // condition: it.condition,
      condition: resolveEffectiveCondition(it),
      tags: it.tags || {},
      // comment: it.comment || "",
      // recs: (it.recommendations_high_severity_only || []).join("; "),
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
          const s = Math.max(0, Math.min(100, Math.round(data.score)));
          setMeta((m) => ({ ...m, score: s }));
        }
      } catch {
        text = localHeuristicSummary();
        const c = results?.batch_summary || { fire_hazard_count: 0, trip_fall_count: 0, none_count: 0 };
        const total = (c.fire_hazard_count || 0) + (c.trip_fall_count || 0);
        const score = Math.max(0, 100 - total * 10);
        const rating =
          score >= 90 ? "Excellent" : score >= 75 ? "Good" : score >= 60 ? "Satisfactory" : score >= 40 ? "Fair" : "Poor";
        setMeta((m) => ({ ...m, overallRating: rating, score }));
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
    const imgs = Array.from(rootEl.querySelectorAll("img"));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((res) => {
          img.onload = () => res();
          img.onerror = () => res();
        });
      })
    );
  };
  
  const triggerPrint = useReactToPrint({
    // v3 API
    contentRef: printRef,
    // v2 API (kept for compatibility)
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
      console.error("Print error:", err);
      alert("PDF export failed. Open Console for details.");
    },
  });

  const onDownloadPDF = () => {
    // If the ref isn't attached, react-to-print won't open anything.
    if (!printRef.current) {
      console.error("Print node ref is null. Ensure PrintReport uses forwardRef and attaches ref to a DOM element.");
      alert("PDF export not ready: printable report is not mounted. Please ensure PrintReport uses forwardRef.");
      return;
    }
    if (typeof triggerPrint === "function") {
      triggerPrint();
      return;
    }
    // Fallback (should rarely happen)
    window.print();
  };

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
    <div className="max-w-6xl mx-auto py-0 print:py-0">
      {/* Off-screen printable node */}
      <div
        style={{ position: "absolute", left: "-10000px", top: 0, width: "794px", padding: "24px", background: "white" }}
        aria-hidden="true"
      >
        <PrintReport
          ref={printRef}
          meta={meta}
          counts={counts}
          perImage={perImage}
          obsRows={obsRows}
          hazardRowsDerived={hazardRowsDerived}
          findings={findings}
          areaRatings={areaRatings}
          avgScore={avgScore}
          imgURL={imgURL}
        />
      </div>

      {/* Cover */}
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
          <Input label="Inspector" value={meta.inspector} onChange={(e) => setMeta({ ...meta, inspector: e.target.value })} />
          <Input label="Weather" value={meta.weather} onChange={(e) => setMeta({ ...meta, weather: e.target.value })} />
          <Input label="IMO" value={meta.imo} onChange={(e) => setMeta({ ...meta, imo: e.target.value })} />
          <Input label="Flag" value={meta.flag} onChange={(e) => setMeta({ ...meta, flag: e.target.value })} />
          <Input label="Call sign" value={meta.callSign} onChange={(e) => setMeta({ ...meta, callSign: e.target.value })} />
        </div>
      </Card>

      {/* Executive Summary */}
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

          <div className="mt-4 p-4 rounded-lg border bg-gray-50">
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

      {/* Inspection Details */}
      <Card className="mb-6 border-t-2 border-cyan-500">
        <SectionHeader id="details" title="Inspection details" icon={IconClipboard} accent="cyan" />
        <div className="p-5 grid md:grid-cols-2 gap-4">
          <TextArea label="Scope" rows={3} value={meta.scope} onChange={(e) => setMeta({ ...meta, scope: e.target.value })} />
          <TextArea
            label="Methodology"
            rows={3}
            value={meta.methodology}
            onChange={(e) => setMeta({ ...meta, methodology: e.target.value })}
          />
          <TextArea
            label="Limitations"
            rows={3}
            value={meta.limitations}
            onChange={(e) => setMeta({ ...meta, limitations: e.target.value })}
          />
        </div>
      </Card>

      {/* Crew & Manning */}
      <Card className="mb-6 border-t-2 border-emerald-500">
        <SectionHeader id="crew" title="Crew & manning" icon={IconUsers} accent="emerald" />
        <div className="p-5 grid md:grid-cols-3 gap-4">
          <Input label="Total crew" value={meta.crewTotal || ""} onChange={(e) => setMeta({ ...meta, crewTotal: e.target.value })} />
          <Input label="Officers" value={meta.officers || ""} onChange={(e) => setMeta({ ...meta, officers: e.target.value })} />
          <Input label="Ratings" value={meta.ratings || ""} onChange={(e) => setMeta({ ...meta, ratings: e.target.value })} />
        </div>
      </Card>

      {/* Findings */}
      <Card className="mb-6 border-t-2 border-amber-500">
        <SectionHeader
          id="kpis"
          title="Findings at a glance"
          icon={IconAlert}
          accent="amber"
          right={
            <button
              onClick={() => setEditFindings((e) => !e)}
              className="px-3 py-1 rounded-lg border text-gray-700 hover:bg-gray-50"
            >
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

      {/* Scorecard */}
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

      {/* Observations */}
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
                className={`px-3 py-1 rounded-lg border ${obsView === "grid" ? "bg-blue-600 text-white border-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setObsView("list")}
                className={`px-3 py-1 rounded-lg border ${obsView === "list" ? "bg-blue-600 text-white border-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
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
              <select value={obsSort.key} onChange={(e) => setObsSort((s) => ({ ...s, key: e.target.value }))} className="border rounded-lg p-2 bg-white w-full">
                <option value="index">#</option>
                <option value="condition">Condition</option>
                <option value="location">Location</option>
              </select>
              <select value={obsSort.dir} onChange={(e) => setObsSort((s) => ({ ...s, dir: e.target.value }))} className="border rounded-lg p-2 bg-white">
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
              {obsFilteredSorted.map(({ raw, index, sourceIndex }, idx) => {

                return (
                  <div key={raw.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(raw)}
                        className="block w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Click to enlarge"
                      >
                        <img
                          src={imgURL(raw.id)}
                          alt={raw.id}
                          className="w-full h-auto max-h-[70vh] object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.png";
                            e.currentTarget.onerror = null;
                          }}
                        />
                      </button>
                      <div className="absolute top-3 left-3">
                        <Tag value={obsFilteredSorted[idx]?.condition} />
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="text-sm font-medium text-gray-900">
                        {raw.location ? `Location: ${raw.location}` : `Observation #${index}`}
                      </div>

                       <div>
                         <div className="text-xs font-medium text-gray-600 mb-1">Location</div>
                         <input
                           className="w-full border rounded-lg p-2 bg-white text-gray-900"
                           defaultValue={raw.location || ""}
                           placeholder="e.g., Engine Room / Main Deck / Bow"
                           onBlur={(e) => persistRow(sourceIndex, { location: e.target.value })}
                         />
                       </div>

                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Comment</div>
                        <textarea
                          className="w-full border rounded-lg p-2 bg-white text-gray-900 min-h-[84px]"
                          defaultValue={raw.comment || ""}
                          onBlur={(e) => persistRow(obsFilteredSorted[idx]?.sourceIndex, { comment: e.target.value })}
                        />
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          Recommendations <span className="text-gray-400">(use ; between items)</span>
                        </div>
                        {getNormalizedRecommendationsArray(raw).length > 0 ? (
                          <textarea
                            className="w-full border rounded-lg p-2 bg-white text-gray-900 min-h-[84px]"
                            defaultValue={getNormalizedRecommendationsArray(raw).join("; ")}
                            onBlur={(e) => persistRow(obsFilteredSorted[idx]?.sourceIndex, { recommendations_high_severity_only: e.target.value })}
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
                  {obsFilteredSorted.map((row, idx) => (
                    <tr key={row.id} className="border-b align-top">
                      <td className="px-3 py-2 text-gray-500">{row.index}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="w-28 h-20 rounded-lg border bg-gray-100 overflow-hidden p-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={() => setSelectedPhoto(row.raw)}
                        >
                          <img
                            src={imgURL(row.id)}
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
                        <div className="line-clamp-3">{row.raw.comment || "—"}</div>
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

      {/* Defects */}
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
    <div className="px-3 py-6 text-center text-gray-500 border rounded-lg bg-white">
      No defects / non-conformities.
    </div>
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
                  src={photoId ? imgURL(photoId) : "/placeholder.png"}
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
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">
                    {row.recommendations ? row.recommendations : "—"}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}

          <p className="mt-2 text-[11px] text-gray-500">
            Tip: click a photo thumbnail to preview. Comments remain available in the photo modal.
          </p>
        </div>
      </Card>

      {/* Photo modal */}
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
                src={imgURL(selectedPhoto.id)}
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
                       const newLoc = e.target.value;
                       const idx = perImage.findIndex((x) => x.id === selectedPhoto.id);
                       if (idx >= 0) persistRow(idx, { location: newLoc });
                       setSelectedPhoto((p) => ({ ...p, location: newLoc }));
                     }}
                   />
                 </div>
                <div><b>Condition:</b> {conditionLabel(resolveEffectiveCondition(selectedPhoto))}</div>
                {selectedPhoto.comment ? <div className="mt-2 whitespace-pre-wrap"><b>Comment:</b> {selectedPhoto.comment}</div> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add defect modal */}
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

