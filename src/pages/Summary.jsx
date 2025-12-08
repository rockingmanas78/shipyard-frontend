import React, {useState, useEffect} from "react";
import api from "../api";
import {useNavigate, useNavigation} from "react-router-dom";

// ---------------------------------------------------------------------------
// Minimal inline SVG icons for section headers
// ---------------------------------------------------------------------------
const IconDoc = (props) => (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
        <rect x="3" y="2" width="14" height="16" rx="2" fill="currentColor" fillOpacity="0.12"/>
        <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="6" y="6" width="8" height="1.5" rx="0.75" fill="currentColor"/>
        <rect x="6" y="9" width="8" height="1.5" rx="0.75" fill="currentColor"/>
        <rect x="6" y="12" width="5" height="1.5" rx="0.75" fill="currentColor"/>
    </svg>
);
const IconClipboard = (props) => (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
        <rect x="5" y="3" width="10" height="14" rx="2" fill="currentColor" fillOpacity="0.12"/>
        <rect x="5" y="3" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="8" y="2" width="4" height="3" rx="1" fill="currentColor"/>
    </svg>
);
const IconUsers = (props) => (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
        <circle cx="7" cy="8" r="3" fill="currentColor" fillOpacity="0.12"/>
        <circle cx="13" cy="10" r="2" fill="currentColor" fillOpacity="0.12"/>
        <circle cx="7" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="13" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 16c0-2.21 2.686-4 6-4s6 1.79 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);
const IconAlert = (props) => (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
        <circle cx="10" cy="10" r="8" fill="currentColor" fillOpacity="0.12"/>
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="5" width="2" height="6" rx="1" fill="currentColor"/>
        <rect x="9" y="13" width="2" height="2" rx="1" fill="currentColor"/>
    </svg>
);
const IconCheck = (props) => (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
        <circle cx="10" cy="10" r="8" fill="currentColor" fillOpacity="0.12"/>
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 10.5l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// -----------------------------------------------------------------------------
// Helper: resolve image URL served by backend (unchanged)
// -----------------------------------------------------------------------------
const imgURL = (id) => `${api.defaults.baseURL}/uploads/${encodeURIComponent(id)}`;

// -----------------------------------------------------------------------------
// Small UI atoms shared across sections
// -----------------------------------------------------------------------------
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
const SectionHeader = ({id, title, subtitle, right, icon: Icon, accent = "default"}) => (
    <div
        id={id}
        className={`px-5 py-4 border-b border-t ${sectionAccent[accent] || sectionAccent.default} rounded-t-xl flex items-center justify-between`}
    >
        <div className="flex items-center gap-3">
            {Icon && (
                <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${iconAccent[accent] || iconAccent.default}`}>
          <Icon className="w-5 h-5"/>
        </span>
            )}
            <div>
                <h2 className="font-semibold text-gray-900">{title}</h2>
                {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
            </div>
        </div>
        {right}
    </div>
);

const Card = ({children, className = ""}) => (
    <div className={`rounded-xl border shadow-lg hover:shadow-xl transition bg-white ${className}`}>{children}</div>
);

const Input = ({label, ...props}) => (
    <label className="block">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <input
            {...props}
            className={`mt-1 w-full border rounded-lg p-2 bg-white text-gray-900 placeholder-gray-400 ${props.className || ""}`}
        />
    </label>
);

const TextArea = ({label, rows = 4, ...props}) => (
    <label className="block">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <textarea
            rows={rows}
            {...props}
            className={`mt-1 w-full border rounded-lg p-2 bg-white text-gray-900 placeholder-gray-400 ${props.className || ""}`}
        />
    </label>
);

const Badge = ({children, tone = "slate"}) => {
    const tones = {
        slate: "bg-slate-50 text-slate-700 border-slate-200",
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        green: "bg-emerald-50 text-emerald-700 border-emerald-200",
        amber: "bg-amber-50 text-amber-800 border-amber-200",
        red: "bg-red-50 text-red-700 border-red-200",
        violet: "bg-violet-50 text-violet-700 border-violet-200",
    };
    return <span className={`text-xs px-2 py-1 rounded-full border ${tones[tone]}`}>{children}</span>;
};

const KeyMetric = ({label, value, tone = "slate"}) => (
    <div className="rounded-xl border bg-white shadow-sm p-4">
        <div className="text-xs text-gray-500">{label}</div>
        <div
            className={`text-3xl font-semibold mt-1 ${tone === "red" ? "text-red-700" : tone === "amber" ? "text-amber-700" : tone === "green" ? "text-emerald-700" : "text-gray-900"}`}>
            {value}
        </div>
    </div>
);

// Common world ports (curated list)
const PORT_OPTIONS = [
    "Singapore (SG SIN)", "Shanghai (CN SHA)", "Ningbo-Zhoushan (CN NGB)", "Shenzhen (CN SZX)", "Qingdao (CN TAO)", "Tianjin (CN TSN)", "Hong Kong (HK HKG)", "Busan (KR PUS)", "Kaohsiung (TW KHH)", "Tokyo (JP TYO)", "Yokohama (JP YOK)", "Kobe (JP UKB)", "Keelung (TW KEL)", "Ho Chi Minh City / Cat Lai (VN SGN)", "Haiphong (VN HPH)", "Jakarta / Tanjung Priok (ID JKT)", "Surabaya (ID SUB)", "Manila (PH MNL)", "Cebu (PH CEB)", "Port Klang (MY PKL)", "Tanjung Pelepas (MY TPP)", "Laem Chabang (TH LCH)", "Colombo (LK CMB)", "Mundra (IN MUN)", "Nhava Sheva / JNPT (IN BOM)", "Karachi (PK KHI)", "Jebel Ali / Dubai (AE DXB)", "Dammam / King Abdulaziz (SA DMM)", "Jeddah Islamic (SA JED)", "Sohar (OM SOH)", "Salalah (OM SLL)", "Suez (EG SUE)", "Port Said (EG PSD)", "Alexandria (EG ALY)", "Durban (ZA DUR)", "Mombasa (KE MBA)", "Rotterdam (NL RTM)", "Antwerp-Bruges (BE ANR)", "Hamburg (DE HAM)", "Bremerhaven (DE BRV)", "Le Havre (FR LEH)", "Valencia (ES VLC)", "Algeciras (ES ALG)", "Barcelona (ES BCN)", "Gioia Tauro (IT GIT)", "Piraeus (GR PIR)", "Constanța (RO CND)", "Felixstowe (UK FXT)", "Southampton (UK SOU)", "Gothenburg (SE GOT)", "Gdańsk (PL GDN)", "Los Angeles (US LAX)", "Long Beach (US LGB)", "New York / New Jersey (US NYC)", "Savannah (US SAV)", "Houston (US HOU)", "Oakland (US OAK)", "Seattle / Tacoma (US SEA)", "Vancouver (CA YVR)", "Prince Rupert (CA PRR)", "Manzanillo (MX ZLO)", "Veracruz (MX VER)", "Santos (BR SSZ)", "Paranaguá (BR PNG)", "Buenos Aires (AR BUE)", "Callao (PE CLL)", "Guayaquil (EC GYE)", "Balboa (PA BLB)", "Colón (PA ONX)", "Cartagena (CO CTG)", "Kingston (JM KIN)", "Sydney / Botany (AU SYD)", "Melbourne (AU MEL)", "Brisbane (AU BNE)", "Auckland (NZ AKL)"
];

// ——— Dropdown options for Defects table ———
const AREA_OPTIONS = [
    "Hull (External)", "Mooring decks and Bosun’s/ foc’sle store", "Main deck and external areas of the Accommodation superstructure", "Cargo Holds / Tanks", "Ballast Tanks / DB Tanks", "Lifeboat(s), life rafts and rescue boat", "CO2 and fire control rooms", "Emergency generator", "SOPEP / Oil spill locker", "Paint and deck stores", "Oxygen / Acetylene store", "Galley and provisions stores", "Gymnasium", "Hospital", "Crew and Officer mess and recreation rooms", "Cabins", "Cargo Control Room", "Bridge, Bridge wings and monkey island", "Engine room and purifier room", "Engine Control Room, workshops, stores and steering gear", "Pump room",
];

const ASSIGNED_TO_OPTIONS = [
    "Master", "Chief Officer", "Chief Engineer", "Second Engineer", "Electrical Office",
];

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------
export default function Summary({model}) {
    console.log(model);
    // Modal photo selection state
    const [selectedPhoto, setSelectedPhoto] = React.useState(null);
    const nav = useNavigate();
    const stored = JSON.parse(localStorage.getItem("iship_results") || "{}");
    console.log("Console stored")
    console.log(stored);
    let results = {};
    if (model === 'openai') {
        results = stored?.results.openai || {}
    } else if (model === 'gemini') {
        results = stored?.results.gemini || {}
    } else if (model === 'claude') {
        results = stored?.results.claude || {}
    }
    console.log("Console stored")
    console.log(results);
    const perImage = Array.isArray(results?.per_image) ? results.per_image : [];
    const counts =
        results?.batch_summary || {
            fire_hazard_count: 0,
            trip_fall_count: 0,
            none_count: 0,
        };

    // ---- AI summary generation state ----
    const [genBusy, setGenBusy] = React.useState(false);
    const [useCustomLocation, setUseCustomLocation] = React.useState(false);

    // ---------------------------------------------------------------------------
    // Section-wise Scorecard state
    // ---------------------------------------------------------------------------
    const [areaRatings, setAreaRatings] = React.useState({
      "Accommodation": { score: 90, rating: "Excellent", remarks: "" },
      "Bridge": { score: 85, rating: "Good", remarks: "" },
      "Engine Room": { score: 80, rating: "Good", remarks: "" },
      "Hull Area": { score: 70, rating: "Satisfactory", remarks: "" },
      "Cargo Control Room": { score: 75, rating: "Satisfactory", remarks: "" },
    });

    const avgScore = Object.values(areaRatings).length
      ? (
          Object.values(areaRatings).reduce((sum, a) => sum + (a.score || 0), 0) /
          Object.values(areaRatings).length
        ).toFixed(1)
      : 0;
    // Form meta
    // ---------------------------------------------------------------------------
    const [meta, setMeta] = React.useState({
        date: new Date().toISOString().slice(0, 10),
        vesselName: "",
        imo: "",
        flag: "",
        callSign: "",
        location: "",
        inspector: "",
        reportRef: "",
        vesselType: "",
        yearBuilt: "",
        classSociety: "",
        owner: "",
        operator: "",
        tonnageGross: "",
        lengthOverall: "",
        beam: "",
        draft: "",
        mainEngine: "",
        propulsion: "",
        fuelType: "",
        crewTotal: "",
        officers: "",
        ratings: "",
        weather: "",
        scope: "General safety walk-through of accessible areas; visual-only.",
        methodology: "Visual inspection, photo tagging via computer vision, rule-based hazard checks.",
        limitations: "No confined space entry; no dismantling of machinery; weather & access permitting.",
        overallRating: "Satisfactory",
        score: null,
        summaryBlurb:
            "The vessel presents generally good housekeeping. One fire hazard was identified near machinery due to oil residue. No trip/fall issues were found in sampled areas.",
    });

    // ---------------------------------------------------------------------------
    // Executive summary helpers
    // ---------------------------------------------------------------------------
    const buildSummaryPayload = () => {
        const clean = JSON.parse(localStorage.getItem("iship_results") || "{}");
        const res = clean.results || results || {};
        const per = Array.isArray(res.per_image) ? res.per_image : [];
        const hazards = per.map((it) => ({
            id: it.id,
            location: it.location || "",
            condition: it.condition,
            tags: it.tags || {},
            comment: it.comment || "",
            recs: (it.recommendations_high_severity_only || []).join("; "),
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
        const c = results?.batch_summary || {fire_hazard_count: 0, trip_fall_count: 0, none_count: 0};
        const locCounts = {};
        perImage.forEach((it) => {
            const key = it.location || "unspecified area";
            locCounts[key] = (locCounts[key] || 0) + 1;
        });
        const topLocs = Object.entries(locCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).join(" & ");
        const parts = [];
        parts.push(`The inspection on ${meta.date || "the stated date"} at ${meta.location || "the reported location"} covered ${perImage.length} photos across ${Object.keys(locCounts).length} area(s).`);
        if (c.fire_hazard_count) parts.push(`${c.fire_hazard_count} fire hazard${c.fire_hazard_count > 1 ? "s" : ""} were flagged.`);
        if (c.trip_fall_count) parts.push(`${c.trip_fall_count} trip/fall issue${c.trip_fall_count > 1 ? "s" : ""} noted.`);
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
                const {data} = await api.post("/api/summarize", payload);
                text = data?.summary || "";
                if (data?.overallRating) {
                    setMeta((m) => ({...m, overallRating: data.overallRating}));
                }
                if (typeof data?.score === "number") {
                    const s = Math.max(0, Math.min(100, Math.round(data.score)));
                    setMeta((m) => ({...m, score: s}));
                }
            } catch {
                // Fallback
                text = localHeuristicSummary();
                const c = results?.batch_summary || {fire_hazard_count: 0, trip_fall_count: 0, none_count: 0};
                const total = (c.fire_hazard_count || 0) + (c.trip_fall_count || 0);
                const score = Math.max(0, 100 - total * 10);
                const rating =
                    score >= 90 ? "Excellent"
                        : score >= 75 ? "Good"
                            : score >= 60 ? "Satisfactory"
                                : score >= 40 ? "Fair"
                                    : "Poor";
                setMeta((m) => ({...m, overallRating: rating, score}));
            }
            setMeta((m) => ({...m, summaryBlurb: text || m.summaryBlurb}));
        } finally {
            setGenBusy(false);
        }
    };

    useEffect(() => {
        const t = (meta.summaryBlurb || "").trim();
        if (!t || t.length < 20) {
            generateSummary();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------------------------------------------------------------------------
    // Observations filters / sorting / view toggle
    // ---------------------------------------------------------------------------
    const [obsView, setObsView] = React.useState("grid"); // "grid" | "list"
    const [obsFilterCond, setObsFilterCond] = React.useState(""); // "", "fire_hazard", "trip_fall", "rust", "attention", "none"
    // REMOVED: obsMissingOnly per request
    const [obsSearch, setObsSearch] = React.useState("");
    const [obsSort, setObsSort] = React.useState({key: "index", dir: "asc"});

    // Build normalized observation rows with derived fields
    const obsRows = React.useMemo(() => {
        return perImage.map((it, i) => {
            const hasRecs = (it.recommendations_high_severity_only || []).length > 0;
            const rust = !!it.tags?.rust_stains;
            const condition =
                it.condition === "none" && rust
                    ? "rust"
                    : it.condition === "none" && hasRecs
                        ? "attention"
                        : it.condition || "none";
            const text = [it.id, it.location, it.comment]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return {
                raw: it,
                index: i + 1,
                id: it.id,
                location: it.location || "",
                condition,
                text,
            };
        });
    }, [perImage]);

    // Apply filters + sorting
    const obsFilteredSorted = React.useMemo(() => {
        let list = obsRows;

        if (obsFilterCond) {
            list = list.filter((r) => r.condition === obsFilterCond);
        }
        if (obsSearch.trim()) {
            const q = obsSearch.trim().toLowerCase();
            list = list.filter((r) => r.text.includes(q));
        }

        const {key, dir} = obsSort;
        const mul = dir === "desc" ? -1 : 1;
        list = [...list].sort((a, b) => {
            const av = a[key] ?? "";
            const bv = b[key] ?? "";
            if (av === bv) return 0;
            return (av > bv ? 1 : -1) * mul;
        });

        return list;
    }, [obsRows, obsFilterCond, obsSearch, obsSort]);

    // ---------------------------------------------------------------------------
    // Persist per-row (unchanged for observation comments/recs)
    // ---------------------------------------------------------------------------
    const persistRow = (rowIndex, updater) => {
        const copy = JSON.parse(localStorage.getItem("iship_results") || "{}");
        const list = copy?.results?.per_image || [];
        if (!list[rowIndex]) return;
        const next = {...list[rowIndex], ...updater};
        if (typeof next.recommendations_high_severity_only === "string") {
            next.recommendations_high_severity_only = next.recommendations_high_severity_only
                .split(";")
                .map((s) => s.trim())
                .filter(Boolean);
        }
        list[rowIndex] = next;
        copy.results.per_image = list;
        localStorage.setItem("iship_results", JSON.stringify(copy));
    };

    // ---------------------------------------------------------------------------
    // Defects: persistent editable overrides & manual entries
    // ---------------------------------------------------------------------------
    const DEFECTS_KEY = "iship_defects_v1";
    const [defects, setDefects] = React.useState(() => {
        try {
            return JSON.parse(localStorage.getItem(DEFECTS_KEY) || "{}");
        } catch {
            return {};
        }
    });
    const getDefect = (id) => defects[id] || {};
    const updateDefect = (id, patch) => {
        setDefects((prev) => {
            const next = {...prev, [id]: {...prev[id], ...patch}};
            localStorage.setItem(DEFECTS_KEY, JSON.stringify(next));
            return next;
        });
    };
    const deleteDefect = (id, isManual) => {
        setDefects((prev) => {
            const next = {...prev};
            if (isManual) {
                delete next[id];
            } else {
                // hide derived row coming from perImage
                next[id] = {...(next[id] || {}), hidden: true};
            }
            localStorage.setItem(DEFECTS_KEY, JSON.stringify(next));
            return next;
        });
    };

    // Add-defect modal state
    const [addOpen, setAddOpen] = React.useState(false);
    const [addForm, setAddForm] = React.useState({
        id: "",
        area: "",
        assignedTo: "",
        condition: "attention", // default
        combined: "",
        deadline: "",
    });
    const resetAddForm = () =>
        setAddForm({
            id: "",
            area: "",
            assignedTo: "",
            condition: "attention",
            combined: "",
            deadline: "",
        });
    const onSaveAdd = () => {
        const key = addForm.id?.trim() ? `manual-${addForm.id.trim()}` : `manual-${Date.now()}`;
        const entry = {
            id: key, // use key as id so it’s unique even if blank input
            photoId: addForm.id?.trim() || "", // keep user-provided photo/file id separately if given
            area: addForm.area || "—",
            assignedTo: addForm.assignedTo || "",
            condition: addForm.condition || "attention",
            combined: addForm.combined || "",
            deadline: addForm.deadline || "",
            manual: true,
        };
        setDefects((prev) => {
            const next = {...prev, [key]: entry};
            localStorage.setItem(DEFECTS_KEY, JSON.stringify(next));
            return next;
        });
        setAddOpen(false);
        resetAddForm();
    };

    // Report download (unchanged, but disabled)
    const [downloading, setDownloading] = React.useState(false);
    const handleDownloadDocx = async () => {
        const clean = JSON.parse(localStorage.getItem("iship_results") || "{}");
        const payload = {meta, results: clean.results || results};

        const safe = (v) =>
            (v ?? "")
                .toString()
                .replace(/[^\w\-]+/g, "_")
                .replace(/_{2,}/g, "_")
                .slice(0, 80);

        setDownloading(true);
        try {
            const blobRes = await api.post("/api/report", payload, {responseType: "blob"});
            const contentType = (blobRes.headers?.["content-type"] || "").toLowerCase();
            const isJson = contentType.includes("application/json");

            if (!isJson) {
                const cd = blobRes.headers?.["content-disposition"] || "";
                const cdNameMatch = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(cd);
                const fname =
                    (cdNameMatch && decodeURIComponent(cdNameMatch[1])) ||
                    `${safe(meta.vesselName || "Vessel")}_Inspection_Report.docx`;

                const blob = new Blob(
                    [blobRes.data],
                    {type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                );

                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = fname;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(a.href);
                return;
            }

            const text = await blobToText(blobRes.data);
            let data = {};
            try {
                data = JSON.parse(text);
            } catch {
            }
            const url = data?.url;

            if (url) {
                const base = (api.defaults.baseURL || "").replace(/\/$/, "");
                const absolute = url.startsWith("http") ? url : `${base}${url}`;
                const sameOrigin =
                    absolute.startsWith(window.location.origin) ||
                    absolute.includes(`://${window.location.host}`);
                if (sameOrigin) {
                    const a = document.createElement("a");
                    a.href = absolute;
                    a.download = `${safe(meta.vesselName || "Vessel")}_Inspection_Report.docx`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } else {
                    window.open(absolute, "_blank");
                }
                return;
            }

            throw new Error("Report API returned JSON but no 'url' field.");
        } catch (err) {
            console.error("Report download failed:", err);
            alert("Could not download report. Please check server logs for /api/report.");
        } finally {
            setDownloading(false);
        }
    };

    async function blobToText(blob) {
        if (typeof blob.text === "function") return blob.text();
        return new Response(blob).text();
    }

    // ---------------------------------------------------------------------------
    // Derived helpers and computed views
    // ---------------------------------------------------------------------------
    const hazardRowsDerived = React.useMemo(() => {
        // From perImage (derived)
        const derived = perImage
            .map((it, i) => {
                const hasRecs = (it.recommendations_high_severity_only || []).length > 0;
                const rust = !!it.tags?.rust_stains;
                const effectiveCondition =
                    it.condition === "none" && rust
                        ? "rust"
                        : it.condition === "none" && hasRecs
                            ? "attention"
                            : it.condition;

                if (effectiveCondition === "none" && !hasRecs) return null;

                const recs =
                    (it.recommendations_high_severity_only || []).join("; ") || "";

                const overrides = getDefect(it.id);
                if (overrides?.hidden) return null; // user deleted/hidden this derived row

                const baseRow = {
                    id: it.id,
                    photoId: it.id,
                    rawId: it.id,
                    index: i + 1,
                    area: it.location || "—",
                    condition: effectiveCondition,
                    comment: it.comment || "",
                    recommendations: recs,
                    manual: false,
                };
                return {...baseRow, ...overrides};
            })
            .filter(Boolean);

        // Manual entries saved in defects
        const manual = Object.values(defects)
            .filter((d) => d && d.manual && !d.hidden)
            .map((d, i) => ({
                id: d.id, // this is manual-*
                index: derived.length + i + 1,
                area: d.area || "—",
                condition: d.condition || "attention",
                comment: "", // for manual we store everything in combined
                recommendations: "",
                combined: d.combined || "",
                assignedTo: d.assignedTo || "",
                deadline: d.deadline || "",
                photoId: d.photoId || "",
                rawId: "",
                manual: true,
            }));

        return [...derived, ...manual];
    }, [perImage, defects]);

    const countsDerived = React.useMemo(() => {
        const fire = hazardRowsDerived.filter((r) => r.condition === "fire_hazard").length;
        const trip = hazardRowsDerived.filter((r) => r.condition === "trip_fall").length;
        const rust = hazardRowsDerived.filter((r) => r.condition === "rust").length;
        const attention = hazardRowsDerived.filter((r) => r.condition === "attention").length;

        // We still compute missingTs for KPI display, but no filter checkbox anymore
        const missingTs = perImage.filter(
            (it) => !(it.timestamp || it.capture_time || it?.exif?.DateTimeOriginal)
        ).length;

        return {fire, trip, rust, attention, missingTs};
    }, [hazardRowsDerived, perImage]);

    // Editable KPIs state
    const [editFindings, setEditFindings] = React.useState(false);
    const [findings, setFindings] = React.useState(() => ({
        fire: 0,
        trip: 0,
        rust: 0,
        attention: 0,
        missingTs: 0,
    }));
    useEffect(() => {
        setFindings({
            fire: countsDerived.fire,
            trip: countsDerived.trip,
            rust: countsDerived.rust,
            attention: countsDerived.attention,
            missingTs: countsDerived.missingTs,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countsDerived.fire, countsDerived.trip, countsDerived.rust, countsDerived.attention, countsDerived.missingTs]);

    // ---------------------------------------------------------------------------
    // Printing helpers
    // ---------------------------------------------------------------------------
    const onPrint = () => window.print();

    // ---------------------------------------------------------------------------
    // Tag for Observations
    // ---------------------------------------------------------------------------
    const Tag = ({value}) => {
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

    // ---------------------------------------------------------------------------
    // Early return if no data yet
    // ---------------------------------------------------------------------------
    if (!results || perImage.length === 0) {
        return (
            <div className="max-w-6xl mx-auto py-10 text-gray-700">
                No results yet. Please upload and analyze photos first.
            </div>
        );
    }

    // Big-photo observation card with fully visible images
    const ObservationCard = ({it, idx}) => {
        const initialComment = it.comment || "";
        const initialRecs = (it.recommendations_high_severity_only || []).join("; ");
        const open = () => setSelectedPhoto({...it, source: "obs"});

        const onBlurComment = (e) => persistRow(idx, {comment: e.target.value});
        const onBlurRecs = (e) =>
            persistRow(idx, {recommendations_high_severity_only: e.target.value});

        const effectiveCond =
            it.condition === "none" && !!it.tags?.rust_stains
                ? "rust"
                : it.condition === "none" && (it.recommendations_high_severity_only || []).length > 0
                    ? "attention"
                    : it.condition;

        return (
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                {/* Photo (auto-sized, preserves aspect) */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={open}
                        className="block w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Click to enlarge and view details"
                    >
                        <img
                            src={imgURL(it.id)}
                            alt={it.id}
                            className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                            onError={(e) => {
                                e.currentTarget.src = "/placeholder.png";
                                e.currentTarget.onerror = null;
                            }}
                        />
                    </button>
                    <div className="absolute top-3 left-3 space-y-1">
                        <Tag value={effectiveCond}/>
                    </div>
                </div>

                {/* Meta + editors */}
                <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-sm font-medium text-gray-900 break-all">{it.id}</div>
                            {it.location ? (
                                <div className="text-xs text-gray-500 mt-1">Location: {it.location}</div>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={open}
                            className="text-xs px-3 py-1 rounded-lg border text-gray-700 hover:bg-gray-50"
                        >
                            View
                        </button>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Comment</div>
                        <textarea
                            className="w-full border rounded-lg p-2 bg-white text-gray-900 min-h-[84px]"
                            defaultValue={initialComment}
                            onBlur={onBlurComment}
                        />
                    </div>

                    <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Recommendations <span
                            className="text-gray-400">(use ; between items)</span></div>
                        {(it.recommendations_high_severity_only?.length > 0 || initialRecs) ? (
                            <textarea
                                className="w-full border rounded-lg p-2 bg-white text-gray-900 min-h-[84px]"
                                defaultValue={initialRecs}
                                onBlur={onBlurRecs}
                            />
                        ) : (
                            <div className="text-xs text-gray-400">—</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ---------------------------------------------------------------------------
    // Page layout
    // ---------------------------------------------------------------------------
    return (
        <div className="max-w-6xl mx-auto py-0 print:py-0">
            {/* Print styles */}
            <style>{`
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }

  header, nav, .no-print, .app-header, .navbar, .topbar {
    display: none !important;
    visibility: hidden !important;
  }

  /* Keep report sections, cards, and photos together */
  .card,
  .rounded-xl,
  .rounded-lg,
  .border,
  .print-keep-together,
  .section-block {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    break-before: auto !important;
    break-after: auto !important;
  }

  /* Ensure large tables, images, or cards start fresh if needed */
  table,
  img,
  .Card,
  .ObservationCard {
    page-break-before: auto !important;
    page-break-after: auto !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* Avoid splitting text content */
  p, h1, h2, h3, h4, h5, h6 {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* Maintain layout visuals */
  img {
    max-width: 100% !important;
    height: auto !important;
  }

  .shadow-sm, .shadow, .shadow-md, .shadow-lg {
    box-shadow: none !important;
  }

  .border {
    border-color: #e5e7eb !important;
  }

  /* Hide dropdown arrows in print */
  select {
    appearance: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    background: none !important;
    border: none !important;
    box-shadow: none !important;
    pointer-events: none !important;
    color: #000 !important;
  }

  /* Hide hazard tags during print */
  .tag,
  .absolute.top-3.left-3,
  .absolute.top-3.left-3.space-y-1 {
    display: none !important;
    visibility: hidden !important;
  }
}
      `}</style>

            {/* Cover / Meta Section */}
            <Card className="mb-6 border-t-2 border-blue-500">
                <SectionHeader
                    id="cover"
                    title={"Vessel Inspection Report " + model.toUpperCase()}
                    subtitle="Generated by iShip Inspection AI — review, edit, and export."
                    icon={IconDoc}
                    accent="blue"
                    right={
                        <div className="flex gap-2 no-print">
                            <button
                                onClick={() => {
                                    nav("/summary")
                                    nav(0)
                                }}
                                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                                title="Open AI Inspection Report"
                            >
                                Open AI
                            </button>
                            {/* <button
                                onClick={() => {
                                    nav("/summary/gemini")
                                    nav(0)
                                }}
                                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                                title="Gemini Inspection Report"
                            >
                                Gemini
                            </button>
                            <button
                                onClick={() => {
                                    nav("/summary/claude")
                                    nav(0)
                                }}
                                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                                title="Claude Inspection Report"
                            >
                                Claude
                            </button> */}
                            <button
                                onClick={onPrint}
                                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                                title="Print or Save as PDF"
                            >
                                Print
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadDocx}
                                disabled
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                title="Download .docx (Disabled in Beta)"
                            >
                                Download .docx (Disabled in Beta)
                            </button>
                        </div>
                    }
                />
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Vessel name" placeholder="Vessel name" value={meta.vesselName}
                           onChange={(e) => setMeta({...meta, vesselName: e.target.value})}/>
                    <label className="block">
                        <span className="text-xs font-medium text-gray-600">Report reference</span>
                        <select
                            className="mt-1 w-full border rounded-lg p-2 bg-white text-gray-900"
                            value={meta.reportRef}
                            onChange={(e) => setMeta({...meta, reportRef: e.target.value})}
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
                    <Input
                        label="Inspection date"
                        type="date"
                        value={meta.date}
                        onChange={(e) => setMeta({...meta, date: e.target.value})}
                    />
                    <label className="block">
                        <span className="text-xs font-medium text-gray-600">Location / Port</span>
                        <select
                            className="mt-1 w-full border rounded-lg p-2 bg-white text-gray-900"
                            value={useCustomLocation ? "__custom__" : (meta.location || "")}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === "__custom__") {
                                    setUseCustomLocation(true);
                                } else {
                                    setUseCustomLocation(false);
                                    setMeta({...meta, location: v});
                                }
                            }}
                        >
                            <option value="">Select port…</option>
                            {PORT_OPTIONS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                            <option value="__custom__">Other / Custom…</option>
                        </select>
                        {useCustomLocation && (
                            <input
                                className="mt-2 w-full border rounded-lg p-2 bg-white text-gray-900"
                                placeholder="Type custom port or location"
                                value={meta.location}
                                onChange={(e) => setMeta({...meta, location: e.target.value})}
                            />
                        )}
                    </label>
                    <Input label="Inspector" placeholder="Inspector name" value={meta.inspector}
                           onChange={(e) => setMeta({...meta, inspector: e.target.value})}/>
                    <Input label="Weather" placeholder="Weather during inspection" value={meta.weather}
                           onChange={(e) => setMeta({...meta, weather: e.target.value})}/>
                    <Input label="IMO" placeholder="IMO number" value={meta.imo}
                           onChange={(e) => setMeta({...meta, imo: e.target.value})}/>
                    <Input label="Flag" placeholder="Flag state" value={meta.flag}
                           onChange={(e) => setMeta({...meta, flag: e.target.value})}/>
                    <Input label="Call sign" placeholder="Call sign" value={meta.callSign}
                           onChange={(e) => setMeta({...meta, callSign: e.target.value})}/>
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
                        <KeyMetric label="Fire hazards" value={counts.fire_hazard_count}
                                   tone={counts.fire_hazard_count > 0 ? "red" : "green"}/>
                        <KeyMetric label="Trip / fall" value={counts.trip_fall_count}
                                   tone={counts.trip_fall_count > 0 ? "amber" : "green"}/>
                        <KeyMetric label="Satisfactory" value={counts.none_count} tone="green"/>
                    </div>
                    <TextArea
                        label="Summary"
                        className="mt-4"
                        rows={4}
                        value={meta.summaryBlurb}
                        onChange={(e) => setMeta({...meta, summaryBlurb: e.target.value})}
                    />
                    <div className="mt-4 p-4 rounded-lg border bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">AI Recommended Overall Rating</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {meta.overallRating || "Calculating..."}
                                </p>
                                {meta.score !== null && (
                                    <p className="text-sm text-gray-500">Score: {meta.score} / 100</p>
                                )}
                            </div>
                            <div className="flex flex-col text-xs text-gray-600">
                                <span className="mb-1">Adjust manually:</span>
                                <select
                                    value={meta.overallRating}
                                    onChange={(e) => setMeta({...meta, overallRating: e.target.value})}
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
                <SectionHeader id="details" title="Inspection details" icon={IconClipboard} accent="cyan"/>
                <div className="p-5 grid md:grid-cols-2 gap-4">
                    <TextArea label="Scope" rows={3} value={meta.scope}
                              onChange={(e) => setMeta({...meta, scope: e.target.value})}/>
                    <TextArea label="Methodology" rows={3} value={meta.methodology}
                              onChange={(e) => setMeta({...meta, methodology: e.target.value})}/>
                    <TextArea label="Limitations" rows={3} value={meta.limitations}
                              onChange={(e) => setMeta({...meta, limitations: e.target.value})}/>
                </div>
            </Card>

            {/* Vessel Particulars */}
            <Card className="mb-6 border-t-2 border-violet-500">
                <SectionHeader id="particulars" title="Vessel particulars" icon={IconDoc} accent="violet"/>
                <div className="p-5 grid md:grid-cols-2 gap-4">
                    <Input label="Vessel type" value={meta.vesselType}
                           onChange={(e) => setMeta({...meta, vesselType: e.target.value})}
                           placeholder="e.g., Oil/Chemical Tanker"/>
                    <Input label="Year built" value={meta.yearBuilt}
                           onChange={(e) => setMeta({...meta, yearBuilt: e.target.value})} placeholder="e.g., 2014"/>
                    <Input label="Class society" value={meta.classSociety}
                           onChange={(e) => setMeta({...meta, classSociety: e.target.value})}
                           placeholder="e.g., DNV / LR / ABS"/>
                    <Input label="Owner" value={meta.owner}
                           onChange={(e) => setMeta({...meta, owner: e.target.value})}/>
                    <Input label="Operator" value={meta.operator}
                           onChange={(e) => setMeta({...meta, operator: e.target.value})}/>
                    <Input label="Gross tonnage" value={meta.tonnageGross}
                           onChange={(e) => setMeta({...meta, tonnageGross: e.target.value})}/>
                    <Input label="Length overall (LOA)" value={meta.lengthOverall}
                           onChange={(e) => setMeta({...meta, lengthOverall: e.target.value})}/>
                    <Input label="Beam" value={meta.beam} onChange={(e) => setMeta({...meta, beam: e.target.value})}/>
                    <Input label="Draft" value={meta.draft}
                           onChange={(e) => setMeta({...meta, draft: e.target.value})}/>
                    <Input label="Main engine" value={meta.mainEngine}
                           onChange={(e) => setMeta({...meta, mainEngine: e.target.value})}
                           placeholder="make/model/power"/>
                    <Input label="Propulsion" value={meta.propulsion}
                           onChange={(e) => setMeta({...meta, propulsion: e.target.value})}
                           placeholder="e.g., CPP / FPP"/>
                    <Input label="Fuel type" value={meta.fuelType}
                           onChange={(e) => setMeta({...meta, fuelType: e.target.value})}
                           placeholder="e.g., VLSFO, MGO"/>
                </div>
            </Card>

            {/* Crew & Manning */}
            <Card className="mb-6 border-t-2 border-emerald-500">
                <SectionHeader id="crew" title="Crew & manning" icon={IconUsers} accent="emerald"/>
                <div className="p-5 grid md:grid-cols-3 gap-4">
                    <Input label="Total crew" value={meta.crewTotal}
                           onChange={(e) => setMeta({...meta, crewTotal: e.target.value})}/>
                    <Input label="Officers" value={meta.officers}
                           onChange={(e) => setMeta({...meta, officers: e.target.value})}/>
                    <Input label="Ratings" value={meta.ratings}
                           onChange={(e) => setMeta({...meta, ratings: e.target.value})}/>
                </div>
            </Card>

            {/* Findings at a glance (editable) */}
            <Card className="mb-6 border-t-2 border-amber-500">
                <SectionHeader
                    id="kpis"
                    title="Findings at a glance"
                    icon={IconAlert}
                    accent="amber"
                    right={
                        <button
                            onClick={() => {
                                if (editFindings) {
                                    // Saving — nothing else needed; state already in findings
                                }
                                setEditFindings((e) => !e);
                            }}
                            className="px-3 py-1 rounded-lg border text-gray-700 hover:bg-gray-50"
                        >
                            {editFindings ? "Save" : "Edit"}
                        </button>
                    }
                />
                <div className="p-5 grid md:grid-cols-5 gap-4">
                    {!editFindings ? (
                        <>
                            <KeyMetric label="Fire hazards" value={findings.fire}
                                       tone={findings.fire ? "red" : "green"}/>
                            <KeyMetric label="Trip / fall" value={findings.trip}
                                       tone={findings.trip ? "amber" : "green"}/>
                            <KeyMetric label="Rust" value={findings.rust} tone={findings.rust ? "amber" : "green"}/>
                            <KeyMetric label="Attention" value={findings.attention}
                                       tone={findings.attention ? "blue" : "green"}/>
                            <KeyMetric label="Missing timestamps" value={findings.missingTs}
                                       tone={findings.missingTs ? "violet" : "green"}/>
                        </>
                    ) : (
                        <>
                            <Input label="Fire hazards" type="number" value={findings.fire}
                                   onChange={(e) => setFindings((f) => ({...f, fire: Number(e.target.value || 0)}))}/>
                            <Input label="Trip / fall" type="number" value={findings.trip}
                                   onChange={(e) => setFindings((f) => ({...f, trip: Number(e.target.value || 0)}))}/>
                            <Input label="Rust" type="number" value={findings.rust}
                                   onChange={(e) => setFindings((f) => ({...f, rust: Number(e.target.value || 0)}))}/>
                            <Input label="Attention" type="number" value={findings.attention}
                                   onChange={(e) => setFindings((f) => ({
                                       ...f,
                                       attention: Number(e.target.value || 0)
                                   }))}/>
                            <Input label="Missing timestamps" type="number" value={findings.missingTs}
                                   onChange={(e) => setFindings((f) => ({
                                       ...f,
                                       missingTs: Number(e.target.value || 0)
                                   }))}/>
                        </>
                    )}
                </div>
            </Card>

            {/* Section-wise Scorecard */}
            <Card className="mb-6 border-t-2 border-green-500">
              <SectionHeader
                id="scorecard"
                title="Section-wise Scorecard"
                subtitle="Rate each vessel area based on observations."
                icon={IconCheck}
                accent="emerald"
              />
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
                            onChange={(e) =>
                              setAreaRatings((prev) => ({
                                ...prev,
                                [area]: { ...prev[area], score: Number(e.target.value) },
                              }))
                            }
                            className="w-20 border rounded-lg p-2 bg-white text-gray-900 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={data.rating}
                            onChange={(e) =>
                              setAreaRatings((prev) => ({
                                ...prev,
                                [area]: { ...prev[area], rating: e.target.value },
                              }))
                            }
                            className="border rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            placeholder="Remarks"
                            value={data.remarks}
                            onChange={(e) =>
                              setAreaRatings((prev) => ({
                                ...prev,
                                [area]: { ...prev[area], remarks: e.target.value },
                              }))
                            }
                            className="w-full border rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {/* Observations – Filters, sort & view toggle */}
            <Card className="mb-6 border-t-2 border-blue-500">
                <SectionHeader
                    id="observations"
                    title="Observations"
                    subtitle="Filter & sort your findings. Toggle grid or list view. Click an image to enlarge."
                    icon={IconClipboard}
                    accent="blue"
                    right={
                        <div className="hidden md:flex items-center gap-2 pr-3">
                            <button
                                type="button"
                                onClick={() => setObsView("grid")}
                                className={`px-3 py-1 rounded-lg border ${obsView === "grid" ? "bg-blue-600 text-white border-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                                title="Grid view"
                            >
                                Grid
                            </button>
                            <button
                                type="button"
                                onClick={() => setObsView("list")}
                                className={`px-3 py-1 rounded-lg border ${obsView === "list" ? "bg-blue-600 text-white border-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                                title="List view"
                            >
                                List
                            </button>
                        </div>
                    }
                />

                {/* Toolbar */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Add More Photos */}
                  <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                    <label
                      htmlFor="add-photos"
                      className="inline-flex items-center px-4 py-2 border rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    >
                      + Add More Photos
                    </label>
                    <input
                      id="add-photos"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (files.length === 0) return;
                        const formData = new FormData();
                        files.forEach((f) => formData.append("images", f));
                        try {
                          const res = await api.post("/api/upload", formData, {
                            headers: { "Content-Type": "multipart/form-data" },
                          });
                          alert("Photos uploaded successfully!");
                          window.location.reload();
                        } catch (err) {
                          console.error("Upload failed", err);
                          alert("Failed to upload photos. Please check the server logs.");
                        }
                      }}
                    />
                  </div>
                    {/* Condition filter */}
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

                    {/* Search */}
                    <label className="block md:col-span-2">
                        <span className="text-xs font-medium text-gray-600">Search</span>
                        <input
                            value={obsSearch}
                            onChange={(e) => setObsSearch(e.target.value)}
                            placeholder="Search location or comment…"
                            className="mt-1 w-full border rounded-lg p-2 bg-white"
                        />
                    </label>

                    {/* Sort */}
                    <label className="block">
                        <span className="text-xs font-medium text-gray-600">Sort by</span>
                        <div className="flex gap-2 mt-1">
                            <select
                                value={obsSort.key}
                                onChange={(e) => setObsSort((s) => ({...s, key: e.target.value}))}
                                className="border rounded-lg p-2 bg-white w-full"
                            >
                                <option value="index">#</option>
                                <option value="condition">Condition</option>
                                <option value="location">Location</option>
                            </select>
                            <select
                                value={obsSort.dir}
                                onChange={(e) => setObsSort((s) => ({...s, dir: e.target.value}))}
                                className="border rounded-lg p-2 bg-white"
                            >
                                <option value="asc">Asc</option>
                                <option value="desc">Desc</option>
                            </select>
                        </div>
                    </label>
                </div>

                {/* Results */}
                {obsView === "grid" ? (
                    <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                        {obsFilteredSorted.map(({raw}, idx) => (
                            <div key={raw.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPhoto({...raw, source: "obs"})}
                                        className="block w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        title="Click to enlarge and view details"
                                    >
                                        <img
                                            src={imgURL(raw.id)}
                                            alt="Observation photo"
                                            className="w-full h-auto max-h-[70vh] object-contain"
                                            onError={(e) => {
                                                e.currentTarget.src = "/placeholder.png";
                                                e.currentTarget.onerror = null;
                                            }}
                                        />
                                    </button>
                                    <div className="absolute top-3 left-3 space-y-1">
                                        <Tag
                                            value={raw.condition === "none" && !!raw.tags?.rust_stains ? "rust" : raw.condition === "none" && (raw.recommendations_high_severity_only || []).length ? "attention" : raw.condition}/>
                                    </div>
                                </div>

                                <div className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="text-sm font-medium text-gray-900">
                                            {raw.location ? `Location: ${raw.location}` : "Observation"}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPhoto({...raw, source: "obs"})}
                                            className="text-xs px-3 py-1 rounded-lg border text-gray-700 hover:bg-gray-50"
                                        >
                                            View
                                        </button>
                                    </div>

                                    <div>
                                        <div className="text-xs font-medium text-gray-600 mb-1">Comment</div>
                                        <textarea
                                            className="w-full border rounded-lg p-2 bg-white text-gray-900 min-h-[84px]"
                                            defaultValue={raw.comment || ""}
                                            onBlur={(e) => persistRow(idx, {comment: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <div className="text-xs font-medium text-gray-600 mb-1">
                                            Recommendations <span className="text-gray-400">(use ; between items)</span>
                                        </div>
                                        {(raw.recommendations_high_severity_only?.length || 0) > 0 ? (
                                            <textarea
                                                className="w-full border rounded-lg p-2 bg-white text-gray-900 min-h-[84px]"
                                                defaultValue={(raw.recommendations_high_severity_only || []).join("; ")}
                                                onBlur={(e) => persistRow(idx, {recommendations_high_severity_only: e.target.value})}
                                            />
                                        ) : (
                                            <div className="text-xs text-gray-400">—</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {obsFilteredSorted.length === 0 && (
                            <div className="px-5 pb-6 text-gray-500">No observations match the filters.</div>
                        )}
                    </div>
                ) : (
                    <div className="px-5 pb-5 overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="text-left font-medium px-3 py-2 w-10">#</th>
                                <th className="text-left font-medium px-3 py-2 w-28">Photo</th>
                                {/* ID column removed to hide filenames */}
                                <th className="text-left font-medium px-3 py-2 w-40">Location</th>
                                <th className="text-left font-medium px-3 py-2 w-32">Condition</th>
                                <th className="text-left font-medium px-3 py-2">Comment</th>
                                <th className="text-left font-medium px-3 py-2 w-24">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {obsFilteredSorted.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                                        No observations match the filters.
                                    </td>
                                </tr>
                            ) : (
                                obsFilteredSorted.map((row) => (
                                    <tr key={row.id} className="border-b align-top">
                                        <td className="px-3 py-2 text-gray-500">{row.index}</td>
                                        <td className="px-3 py-2">
                                            <button
                                                type="button"
                                                className="w-28 h-20 rounded-lg border bg-gray-100 overflow-hidden p-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                onClick={() => setSelectedPhoto({...row.raw, source: "obs"})}
                                                title="Click to enlarge and view details"
                                            >
                                                <img
                                                    src={imgURL(row.id)}
                                                    alt="Observation"
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
                                            <Tag value={row.condition}/>
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">
                                            <div className="line-clamp-3">{row.raw.comment || "—"}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPhoto({...row.raw, source: "obs"})}
                                                className="text-xs px-3 py-1 rounded-lg border text-gray-700 hover:bg-gray-50"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Defects / Non-conformities */}
            <Card className="mb-6 print:break-before-page border-t-2 border-rose-500">
                <SectionHeader
                    id="defects"
                    title="Defects & non-conformities"
                    subtitle="Auto-prepared from observations. You can add/edit/delete."
                    icon={IconAlert}
                    accent="rose"
                    right={
                        <button
                            className="px-3 py-1 rounded-lg border text-gray-700 hover:bg-gray-50"
                            onClick={() => setAddOpen(true)}
                        >
                            + Add Defect
                        </button>
                    }
                />
                <div className="p-5">
                    {hazardRowsDerived.length === 0 ? (
                        <div className="px-3 py-6 text-center text-gray-500">
                            No defects / non-conformities.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {hazardRowsDerived.map((row, idx) => (
                                <div key={row.id}
                                     className="rounded-lg border p-4 bg-white shadow-sm mb-4 flex flex-col md:flex-row gap-4">
                                    {/* Photo */}
                                    <div className="flex-shrink-0 w-full md:w-40 flex flex-col items-center">
                                        <button
                                            type="button"
                                            className="block w-full"
                                            onClick={() => setSelectedPhoto({
                                                ...row,
                                                source: "defect",
                                                photoId: row.photoId || row.rawId || row.id
                                            })}
                                            title="Click to enlarge and view details"
                                        >
                                            <div
                                                className="w-full md:w-36 aspect-[4/3] rounded-lg border bg-gray-100 overflow-hidden flex items-center justify-center"
                                                style={{height: "auto", minHeight: "5.5rem"}}
                                            >
                                                <img
                                                    src={
                                                        row.photoId
                                                            ? imgURL(row.photoId)
                                                            : row.rawId
                                                                ? imgURL(row.rawId)
                                                                : row.id
                                                                    ? imgURL(row.id)
                                                                    : "/placeholder.png"
                                                    }
                                                    alt="Defect photo"
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.src = "/placeholder.png";
                                                        e.currentTarget.onerror = null;
                                                    }}
                                                    title={(row.photoId || row.rawId || row.id) || "No image"}
                                                />
                                            </div>
                                        </button>
                                        <div className="mt-2 text-xs text-gray-500">#{idx + 1}</div>
                                    </div>
                                    {/* Details */}
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Left column */}
                                        <div className="flex flex-col gap-2">
                                            {/* Area dropdown + custom */}
                                            <label className="block">
                                                <span className="text-xs font-medium text-gray-600">Area</span>
                                                {(() => {
                                                    const selected = AREA_OPTIONS.includes(row.area || "") ? row.area : "__custom__";
                                                    return (
                                                        <>
                                                            <select
                                                                value={selected}
                                                                onChange={(e) => {
                                                                    const v = e.target.value;
                                                                    if (v === "__custom__") {
                                                                        if (AREA_OPTIONS.includes(row.area || "")) {
                                                                            updateDefect(row.id, {area: ""});
                                                                        }
                                                                    } else {
                                                                        updateDefect(row.id, {area: v});
                                                                    }
                                                                }}
                                                                className="w-full border rounded-lg p-2 bg-white"
                                                            >
                                                                <option value="" disabled>
                                                                    Select area…
                                                                </option>
                                                                {AREA_OPTIONS.map((opt) => (
                                                                    <option key={opt} value={opt}>
                                                                        {opt}
                                                                    </option>
                                                                ))}
                                                                <option value="__custom__">Others (typed manually)
                                                                </option>
                                                            </select>
                                                            {selected === "__custom__" && (
                                                                <input
                                                                    className="w-full border rounded-lg p-2 bg-white mt-2"
                                                                    placeholder="Type area…"
                                                                    value={row.area || ""}
                                                                    onChange={(e) => updateDefect(row.id, {area: e.target.value})}
                                                                />
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </label>
                                            {/* Assigned to dropdown + custom */}
                                            <label className="block">
                                                <span className="text-xs font-medium text-gray-600">Assigned to / Responsible</span>
                                                {(() => {
                                                    const selected = ASSIGNED_TO_OPTIONS.includes(row.assignedTo || "")
                                                        ? row.assignedTo
                                                        : "__custom__";
                                                    return (
                                                        <>
                                                            <select
                                                                value={selected}
                                                                onChange={(e) => {
                                                                    const v = e.target.value;
                                                                    if (v === "__custom__") {
                                                                        if (ASSIGNED_TO_OPTIONS.includes(row.assignedTo || "")) {
                                                                            updateDefect(row.id, {assignedTo: ""});
                                                                        }
                                                                    } else {
                                                                        updateDefect(row.id, {assignedTo: v});
                                                                    }
                                                                }}
                                                                className="w-full border rounded-lg p-2 bg-white"
                                                            >
                                                                <option value="" disabled>
                                                                    Select responsible…
                                                                </option>
                                                                {ASSIGNED_TO_OPTIONS.map((opt) => (
                                                                    <option key={opt} value={opt}>
                                                                        {opt}
                                                                    </option>
                                                                ))}
                                                                <option value="__custom__">Other (Manually)</option>
                                                            </select>
                                                            {selected === "__custom__" && (
                                                                <input
                                                                    className="w-full border rounded-lg p-2 bg-white mt-2"
                                                                    placeholder="Type name or department…"
                                                                    value={row.assignedTo || ""}
                                                                    onChange={(e) => updateDefect(row.id, {assignedTo: e.target.value})}
                                                                />
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </label>
                                            {/* Category badge + select */}
                                            <div>
                                                <span className="text-xs font-medium text-gray-600">Category</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        tone={
                                                            row.condition === "fire_hazard"
                                                                ? "red"
                                                                : row.condition === "trip_fall" || row.condition === "rust"
                                                                    ? "amber"
                                                                    : "blue"
                                                        }
                                                    >
                                                        {row.condition === "fire_hazard"
                                                            ? "Fire hazard"
                                                            : row.condition === "trip_fall"
                                                                ? "Trip/Fall"
                                                                : row.condition === "rust"
                                                                    ? "Rust"
                                                                    : "Attention"}
                                                    </Badge>
                                                    <select
                                                        className="border rounded-lg p-1 bg-white text-xs"
                                                        value={row.condition}
                                                        onChange={(e) => updateDefect(row.id, {condition: e.target.value})}
                                                    >
                                                        <option value="fire_hazard">Fire hazard</option>
                                                        <option value="trip_fall">Trip / fall</option>
                                                        <option value="rust">Rust</option>
                                                        <option value="attention">Attention</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {/* Defect Codes */}
                                            <div>
                                                <span className="text-xs font-medium text-gray-600">Defect Codes</span>
                                                <div className="mt-1 flex flex-col gap-2">
                                                    {Array.isArray(row.defect_codes) && row.defect_codes.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {row.defect_codes.map((code) => (
                                                                <Badge key={code} tone="violet">
                                                                    {code}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                    {/* Multi-select for adding/editing codes */}
                                                    <select
                                                        multiple
                                                        className="w-full border rounded-lg p-2 bg-white text-xs"
                                                        value={row.defect_codes || []}
                                                        onChange={(e) => {
                                                            const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                                                            updateDefect(row.id, {defect_codes: opts});
                                                        }}
                                                    >
                                                        <option value="VIQ-01.01">VIQ-01.01 – Safety policy not
                                                            displayed/communicated
                                                        </option>
                                                        <option value="VIQ-01.02">VIQ-01.02 – SMS manual
                                                            missing/incomplete
                                                        </option>
                                                        <option value="VIQ-01.03">VIQ-01.03 – Management review
                                                            overdue
                                                        </option>
                                                        <option value="VIQ-01.04">VIQ-01.04 – Company safety objectives
                                                            not measurable
                                                        </option>
                                                        <option value="VIQ-01.05">VIQ-01.05 – Vessel documentation
                                                            inconsistent with SMS
                                                        </option>

                                                        <option value="VIQ-02.01">VIQ-02.01 – Shore staff competence
                                                            records missing
                                                        </option>
                                                        <option value="VIQ-02.02">VIQ-02.02 – Training matrix not
                                                            updated
                                                        </option>
                                                        <option value="VIQ-02.03">VIQ-02.03 – Job descriptions unclear /
                                                            missing
                                                        </option>
                                                        <option value="VIQ-02.04">VIQ-02.04 – Appraisal or performance
                                                            review overdue
                                                        </option>

                                                        <option value="VIQ-03.01">VIQ-03.01 – Seafarer certificates
                                                            invalid/expired
                                                        </option>
                                                        <option value="VIQ-03.02">VIQ-03.02 – Incomplete induction of
                                                            new crew
                                                        </option>
                                                        <option value="VIQ-03.03">VIQ-03.03 – Training records missing
                                                            (crew)
                                                        </option>
                                                        <option value="VIQ-03.04">VIQ-03.04 – Rest hour non-compliance
                                                        </option>
                                                        <option value="VIQ-03.05">VIQ-03.05 – Crew appraisal not
                                                            conducted
                                                        </option>

                                                        <option value="VIQ-04.01">VIQ-04.01 – Planned maintenance
                                                            overdue
                                                        </option>
                                                        <option value="VIQ-04.02">VIQ-04.02 – Main engine defect
                                                        </option>
                                                        <option value="VIQ-04.03">VIQ-04.03 – Auxiliary engine defect
                                                        </option>
                                                        <option value="VIQ-04.04">VIQ-04.04 – Steering gear
                                                            malfunction
                                                        </option>
                                                        <option value="VIQ-04.05">VIQ-04.05 – Maintenance records
                                                            incomplete
                                                        </option>
                                                        <option value="VIQ-04.06">VIQ-04.06 – Critical spares
                                                            missing/unavailable
                                                        </option>

                                                        <option value="VIQ-05.01">VIQ-05.01 – Radar defective / not
                                                            operational
                                                        </option>
                                                        <option value="VIQ-05.02">VIQ-05.02 – ECDIS malfunction /
                                                            outdated charts
                                                        </option>
                                                        <option value="VIQ-05.03">VIQ-05.03 – Gyro compass error /
                                                            defective
                                                        </option>
                                                        <option value="VIQ-05.04">VIQ-05.04 – Magnetic compass deviation
                                                            not recorded
                                                        </option>
                                                        <option value="VIQ-05.05">VIQ-05.05 – VDR inoperative</option>
                                                        <option value="VIQ-05.06">VIQ-05.06 – Passage plan
                                                            incomplete/missing
                                                        </option>
                                                        <option value="VIQ-05.07">VIQ-05.07 – Bridge procedures not
                                                            followed
                                                        </option>
                                                        <option value="VIQ-05.08">VIQ-05.08 – Non-compliance with
                                                            COLREGs
                                                        </option>

                                                        <option value="VIQ-06.01">VIQ-06.01 – Cargo pump defective
                                                        </option>
                                                        <option value="VIQ-06.02">VIQ-06.02 – Cargo line leakage
                                                        </option>
                                                        <option value="VIQ-06.03">VIQ-06.03 – Mooring winch defect
                                                        </option>
                                                        <option value="VIQ-06.04">VIQ-06.04 – Mooring ropes
                                                            worn/damaged
                                                        </option>
                                                        <option value="VIQ-06.05">VIQ-06.05 – Ballast pump/system
                                                            malfunction
                                                        </option>
                                                        <option value="VIQ-06.06">VIQ-06.06 – Cargo documentation
                                                            incomplete
                                                        </option>

                                                        <option value="VIQ-07.01">VIQ-07.01 – MoC procedure not
                                                            followed
                                                        </option>
                                                        <option value="VIQ-07.02">VIQ-07.02 – Risk assessment
                                                            missing/incomplete
                                                        </option>
                                                        <option value="VIQ-07.03">VIQ-07.03 – Change not communicated to
                                                            crew
                                                        </option>
                                                        <option value="VIQ-07.04">VIQ-07.04 – Records of MoC not
                                                            maintained
                                                        </option>

                                                        <option value="VIQ-08.01">VIQ-08.01 – Incident not reported
                                                            timely
                                                        </option>
                                                        <option value="VIQ-08.02">VIQ-08.02 – Root cause analysis
                                                            missing/incomplete
                                                        </option>
                                                        <option value="VIQ-08.03">VIQ-08.03 – Corrective action not
                                                            implemented
                                                        </option>
                                                        <option value="VIQ-08.04">VIQ-08.04 – Lessons learned not
                                                            shared/documented
                                                        </option>

                                                        <option value="VIQ-09.01">VIQ-09.01 – PPE not used/available
                                                        </option>
                                                        <option value="VIQ-09.02">VIQ-09.02 – Unsafe working practices
                                                            observed
                                                        </option>
                                                        <option value="VIQ-09.03">VIQ-09.03 – Toolbox talk
                                                            missing/inadequate
                                                        </option>
                                                        <option value="VIQ-09.04">VIQ-09.04 – Permit-to-work not
                                                            issued/invalid
                                                        </option>
                                                        <option value="VIQ-09.05">VIQ-09.05 – Safety signage
                                                            missing/unclear
                                                        </option>

                                                        <option value="VIQ-10.01">VIQ-10.01 – Oily water separator
                                                            defective
                                                        </option>
                                                        <option value="VIQ-10.02">VIQ-10.02 – MARPOL Annex I violation
                                                        </option>
                                                        <option value="VIQ-10.03">VIQ-10.03 – Garbage record book
                                                            incorrect
                                                        </option>
                                                        <option value="VIQ-10.04">VIQ-10.04 – Sewage treatment plant
                                                            malfunction
                                                        </option>
                                                        <option value="VIQ-10.05">VIQ-10.05 – Air emission control
                                                            system defect
                                                        </option>
                                                        <option value="VIQ-10.06">VIQ-10.06 – Ballast water record book
                                                            missing/incomplete
                                                        </option>

                                                        <option value="VIQ-11.01">VIQ-11.01 – Lifeboat engine
                                                            defective
                                                        </option>
                                                        <option value="VIQ-11.02">VIQ-11.02 – Lifeboat launching
                                                            appliance defect
                                                        </option>
                                                        <option value="VIQ-11.03">VIQ-11.03 – Fire pump not
                                                            operational
                                                        </option>
                                                        <option value="VIQ-11.04">VIQ-11.04 – Emergency drill not
                                                            conducted/documented
                                                        </option>
                                                        <option value="VIQ-11.05">VIQ-11.05 – Emergency lighting not
                                                            operational
                                                        </option>
                                                        <option value="VIQ-11.06">VIQ-11.06 – Contingency plan not
                                                            updated
                                                        </option>

                                                        <option value="VIQ-12.01">VIQ-12.01 – KPIs not
                                                            monitored/reported
                                                        </option>
                                                        <option value="VIQ-12.02">VIQ-12.02 – Audit schedule overdue
                                                        </option>
                                                        <option value="VIQ-12.03">VIQ-12.03 – Audit nonconformities
                                                            unaddressed
                                                        </option>
                                                        <option value="VIQ-12.04">VIQ-12.04 – Feedback loop
                                                            ineffective
                                                        </option>
                                                        <option value="VIQ-12.05">VIQ-12.05 – Management review
                                                            ineffective
                                                        </option>

                                                        <option value="VIQ-13.01">VIQ-13.01 – Access control failure
                                                        </option>
                                                        <option value="VIQ-13.02">VIQ-13.02 – ISPS documentation
                                                            incomplete
                                                        </option>
                                                        <option value="VIQ-13.03">VIQ-13.03 – Security drills not
                                                            carried out
                                                        </option>
                                                        <option value="VIQ-13.04">VIQ-13.04 – Ship Security Alert System
                                                            (SSAS) defect
                                                        </option>
                                                        <option value="VIQ-13.05">VIQ-13.05 – Unauthorized persons
                                                            onboard
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Right column */}
                                        <div className="flex flex-col gap-2">
                                            {/* Description & Recommendations */}
                                            <label className="block flex-1">
                                                <span
                                                    className="text-xs font-medium text-gray-600">Description &amp; Recommendations</span>
                                                <textarea
                                                    value={
                                                        typeof row.combined === "string"
                                                            ? row.combined
                                                            : (row.comment || "") +
                                                            (row.recommendations ? " — Recs: " + row.recommendations : "")
                                                    }
                                                    onChange={(e) => updateDefect(row.id, {combined: e.target.value})}
                                                    className="w-full border rounded-lg p-2 bg-white min-h-[88px]"
                                                />
                                            </label>
                                            {/* Target Deadline */}
                                            <label className="block">
                                                <span
                                                    className="text-xs font-medium text-gray-600">Targeted Deadline</span>
                                                <input
                                                    type="date"
                                                    value={row.deadline || ""}
                                                    onChange={(e) => updateDefect(row.id, {deadline: e.target.value})}
                                                    className="w-full border rounded-lg p-2 bg-white"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div
                                        className="flex md:flex-col md:justify-between justify-end items-end md:items-end gap-2 md:ml-4 mt-2 md:mt-0">
                                        <button
                                            type="button"
                                            className="text-xs px-3 py-1 rounded-lg border text-red-700 hover:bg-red-50"
                                            onClick={() => deleteDefect(row.id, row.manual)}
                                            title={row.manual ? "Delete" : "Hide this derived row"}
                                        >
                                            {row.manual ? "Delete" : "Hide"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Conclusion & Recommendations summary */}
            <Card className="mb-6 border-t-2 border-emerald-500">
                <SectionHeader
                    id="conclusion"
                    title="Conclusion & recommendations"
                    icon={IconCheck}
                    accent="emerald"
                />
                <div className="p-5 grid md:grid-cols-2 gap-4">
                    <TextArea
                        label="Conclusion"
                        rows={5}
                        value={
                            meta.conclusion ||
                            `Based on the scope and visual checks performed, the vessel is assessed as "${meta.overallRating}". Outstanding items should be rectified at the earliest opportunity, and routine housekeeping standards should be maintained.`
                        }
                        onChange={(e) => setMeta({...meta, conclusion: e.target.value})}
                    />
                    <TextArea
                        label="General recommendations"
                        rows={5}
                        value={
                            meta.generalRecs ||
                            "1) Address identified fire hazard(s) by cleaning oil residue and securing sources. 2) Maintain walkways clear, verify signage and fire-fighting readiness. 3) Continue routine planned maintenance and periodic housekeeping audits."
                        }
                        onChange={(e) => setMeta({...meta, generalRecs: e.target.value})}
                    />
                </div>
            </Card>

            {/* Declarations */}
            <Card className="mb-6 border-t-2 border-blue-500">
                <SectionHeader
                    id="declaration"
                    title="Inspector’s declaration & acknowledgements"
                    icon={IconUsers}
                    accent="blue"
                />
                <div className="p-5 grid md:grid-cols-2 gap-6">
                    <div>
                        <div className="text-sm font-medium text-gray-800 mb-2">Inspector’s declaration</div>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1" defaultChecked/>
                                <span>
            This report reflects the conditions observed during the inspection date and scope
            stated.
          </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1" defaultChecked/>
                                <span>No dismantling was performed; findings are based on visual inspection only.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1"/>
                                <span>Photographs have been appended to support key observations.</span>
                            </li>
                        </ul>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <Input
                                label="Inspector name"
                                value={meta.inspector}
                                onChange={(e) => setMeta({...meta, inspector: e.target.value})}
                            />
                            <Input
                                label="Date"
                                type="date"
                                value={meta.date}
                                onChange={(e) => setMeta({...meta, date: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-800 mb-2">Master / owner acknowledgement</div>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1"/>
                                <span>The Master/owner representative has reviewed the findings and recommendations.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1"/>
                                <span>Action will be taken to address the listed items within appropriate timeframes.</span>
                            </li>
                        </ul>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <Input
                                label="Acknowledged by"
                                value={meta.ackBy || ""}
                                onChange={(e) => setMeta({...meta, ackBy: e.target.value})}
                            />
                            <Input
                                label="Title / role"
                                value={meta.ackRole || ""}
                                onChange={(e) => setMeta({...meta, ackRole: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Footer actions */}
            <div className="mt-6 flex items-center gap-3 no-print">
                <button
                    onClick={onPrint}
                    className="px-5 py-3 rounded-lg border text-gray-700 hover:bg-gray-50"
                >
                    Print / Save PDF
                </button>
                <button
                    type="button"
                    onClick={handleDownloadDocx}
                    disabled
                    className="px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    title="Download .docx report (Disabled in Beta)"
                >
                    Download .docx report (Disabled in Beta)
                </button>
            </div>

            {/* Image / Row Modal (improved) */}
            {selectedPhoto && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70]">
                    <div className="bg-white rounded-xl p-6 w-full max-w-5xl relative shadow-2xl">
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        {(() => {
                            const isObs = selectedPhoto.source === "obs";
                            const effectiveCond = isObs
                                ? selectedPhoto.condition === "none" && !!selectedPhoto.tags?.rust_stains
                                    ? "rust"
                                    : selectedPhoto.condition === "none" &&
                                    (selectedPhoto.recommendations_high_severity_only || []).length > 0
                                        ? "attention"
                                        : selectedPhoto.condition
                                : selectedPhoto.condition;

                            const labelMap = {
                                fire_hazard: "Fire hazard",
                                trip_fall: "Trip / fall",
                                none: "Satisfactory",
                                rust: "Rust",
                                attention: "Attention",
                            };

                            const currentId = selectedPhoto.photoId || selectedPhoto.rawId || selectedPhoto.id || "";

                            return (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Large image with safe sizing */}
                                    <div>
                                        <div
                                            className="w-full max-h-[74vh] rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center">
                                            <img
                                                src={imgURL(currentId)}
                                                alt=""
                                                className="w-full h-auto max-h-[74vh] object-contain"
                                            />
                                        </div>

                                    </div>

                                    {/* Details */}
                                    <div className="space-y-3 text-sm">
                                        {currentId ? (
                                            <div>
                                                <div className="text-xs font-medium text-gray-600">Linked Photo</div>
                                                <div
                                                    className="mt-0.5 text-gray-900 break-all">{/* hidden filename by request */}</div>
                                            </div>
                                        ) : null}

                                        {isObs ? (
                                            <>
                                                {selectedPhoto.location ? (
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-600">Area</div>
                                                        <div
                                                            className="mt-0.5 text-gray-900">{selectedPhoto.location}</div>
                                                    </div>
                                                ) : null}
                                                {effectiveCond ? (
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-600">Category
                                                        </div>
                                                        <div className="mt-0.5 text-gray-900">
                                                            {labelMap[effectiveCond] || effectiveCond}
                                                        </div>
                                                    </div>
                                                ) : null}
                                                {selectedPhoto.comment ? (
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-600">Description
                                                        </div>
                                                        <div className="mt-0.5 text-gray-900 whitespace-pre-wrap">
                                                            {selectedPhoto.comment}
                                                        </div>
                                                    </div>
                                                ) : null}
                                                {(selectedPhoto.recommendations_high_severity_only || []).length > 0 ? (
                                                    <div>
                                                        <div
                                                            className="text-xs font-medium text-gray-600">Recommendations
                                                        </div>
                                                        <div className="mt-0.5 text-gray-900 whitespace-pre-wrap">
                                                            {(selectedPhoto.recommendations_high_severity_only || []).join("; ")}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </>
                                        ) : (
                                            <>
                                                {selectedPhoto.area ? (
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-600">Area</div>
                                                        <div className="mt-0.5 text-gray-900">{selectedPhoto.area}</div>
                                                    </div>
                                                ) : null}
                                                {effectiveCond ? (
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-600">Category
                                                        </div>
                                                        <div className="mt-0.5 text-gray-900">
                                                            {labelMap[effectiveCond] || effectiveCond}
                                                        </div>
                                                    </div>
                                                ) : null}
                                                {selectedPhoto.combined || selectedPhoto.comment ? (
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-600">Description
                                                        </div>
                                                        <div className="mt-0.5 text-gray-900 whitespace-pre-wrap">
                                                            {selectedPhoto.combined || selectedPhoto.comment}
                                                        </div>
                                                    </div>
                                                ) : null}
                                                {selectedPhoto.recommendations ? (
                                                    <div>
                                                        <div
                                                            className="text-xs font-medium text-gray-600">Recommendations
                                                        </div>
                                                        <div className="mt-0.5 text-gray-900 whitespace-pre-wrap">
                                                            {selectedPhoto.recommendations}
                                                        </div>
                                                    </div>
                                                ) : null}
                                                {selectedPhoto.assignedTo ? (
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-600">Assigned to
                                                        </div>
                                                        <div
                                                            className="mt-0.5 text-gray-900">{selectedPhoto.assignedTo}</div>
                                                    </div>
                                                ) : null}
                                                {selectedPhoto.deadline ? (
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-600">Deadline
                                                        </div>
                                                        <div
                                                            className="mt-0.5 text-gray-900">{selectedPhoto.deadline}</div>
                                                    </div>
                                                ) : null}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Add Defect Modal */}
            {addOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[60] overflow-y-auto p-6">
                    <div
                        className="bg-white rounded-xl p-6 w-full max-w-2xl relative shadow-xl max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => {
                                setAddOpen(false);
                            }}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Defect / Non-conformity</h3>

                        <div className="grid grid-cols-1 gap-4">
                            {/* Choose existing backend photo to bind immediately */}
                            <div className="block">
                                <span
                                    className="text-xs font-medium text-gray-600">Select photo from backend (optional)</span>
                                {/* Simple fallback select for accessibility / keyboards */}
                                <label className="sr-only" htmlFor="add-photo-select">Select photo</label>
                                <select
                                    id="add-photo-select"
                                    className="mt-1 w-full border rounded-lg p-2 bg-white"
                                    value={addForm.id}
                                    onChange={(e) => setAddForm((f) => ({...f, id: e.target.value}))}
                                >
                                    <option value="">— Choose photo —</option>
                                    {perImage.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {(p.location ? `${p.location} — ` : "") + p.id}
                                        </option>
                                    ))}
                                </select>

                                {/* Live preview of the currently selected photo */}
                                {addForm.id ? (
                                    <div className="mt-3">
                                        <div className="text-xs text-gray-600 mb-1">Preview</div>
                                        <div
                                            className="w-full max-h-[50vh] rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center">
                                            <img
                                                src={imgURL(addForm.id)}
                                                alt="Selected preview"
                                                className="w-full h-auto max-h-[50vh] object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/placeholder.png";
                                                    e.currentTarget.onerror = null;
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                {/* Thumbnail picker (click to choose). Works alongside the select above. */}
                                <div className="mt-3">
                                    <div className="text-xs text-gray-600 mb-1">Or pick from thumbnails</div>
                                    <div
                                        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[240px] overflow-y-auto p-1 border rounded-lg bg-white">
                                        {perImage.map((p) => {
                                            const active = addForm.id === p.id;
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className={`relative w-full aspect-[4/3] rounded-md overflow-hidden border ${active ? "ring-2 ring-blue-600 border-blue-600" : "border-gray-200 hover:border-gray-400"}`}
                                                    title={p.location ? `${p.location} — ${p.id}` : p.id}
                                                    onClick={() => setAddForm((f) => ({...f, id: p.id}))}
                                                >
                                                    <img
                                                        src={imgURL(p.id)}
                                                        alt={p.id}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src = "/placeholder.png";
                                                            e.currentTarget.onerror = null;
                                                        }}
                                                    />
                                                    {active ? (
                                                        <span
                                                            className="absolute inset-0 pointer-events-none ring-2 ring-blue-600 rounded-md"/>
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <label className="block">
                                <span className="text-xs font-medium text-gray-600">Area</span>
                                <select
                                    className="mt-1 w-full border rounded-lg p-2 bg-white"
                                    value={AREA_OPTIONS.includes(addForm.area) ? addForm.area : "__custom__"}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === "__custom__") setAddForm((f) => ({...f, area: ""}));
                                        else setAddForm((f) => ({...f, area: v}));
                                    }}
                                >
                                    <option value="" disabled>
                                        Select area…
                                    </option>
                                    {AREA_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                    <option value="__custom__">Others (typed manually)</option>
                                </select>
                                {!AREA_OPTIONS.includes(addForm.area) && (
                                    <input
                                        className="mt-2 w-full border rounded-lg p-2 bg-white"
                                        placeholder="Type area…"
                                        value={addForm.area}
                                        onChange={(e) => setAddForm((f) => ({...f, area: e.target.value}))}
                                    />
                                )}
                            </label>

                            <label className="block">
                                <span className="text-xs font-medium text-gray-600">Assigned to / Responsible</span>
                                <select
                                    className="mt-1 w-full border rounded-lg p-2 bg-white"
                                    value={ASSIGNED_TO_OPTIONS.includes(addForm.assignedTo) ? addForm.assignedTo : "__custom__"}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === "__custom__") setAddForm((f) => ({...f, assignedTo: ""}));
                                        else setAddForm((f) => ({...f, assignedTo: v}));
                                    }}
                                >
                                    <option value="" disabled>
                                        Select responsible…
                                    </option>
                                    {ASSIGNED_TO_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                    <option value="__custom__">Other (Manually)</option>
                                </select>
                                {!ASSIGNED_TO_OPTIONS.includes(addForm.assignedTo) && (
                                    <input
                                        className="mt-2 w-full border rounded-lg p-2 bg-white"
                                        placeholder="Type name or department…"
                                        value={addForm.assignedTo}
                                        onChange={(e) => setAddForm((f) => ({...f, assignedTo: e.target.value}))}
                                    />
                                )}
                            </label>

                            <label className="block">
                                <span className="text-xs font-medium text-gray-600">Category</span>
                                <select
                                    className="mt-1 w-full border rounded-lg p-2 bg-white"
                                    value={addForm.condition}
                                    onChange={(e) => setAddForm((f) => ({...f, condition: e.target.value}))}
                                >
                                    <option value="fire_hazard">Fire hazard</option>
                                    <option value="trip_fall">Trip / fall</option>
                                    <option value="rust">Rust</option>
                                    <option value="attention">Attention</option>
                                </select>
                            </label>

                            <TextArea
                                label="Description & Recommendations"
                                rows={4}
                                placeholder="Write a short description and any recommendations…"
                                value={addForm.combined}
                                onChange={(e) => setAddForm((f) => ({...f, combined: e.target.value}))}
                            />

                            <Input
                                label="Targeted deadline"
                                type="date"
                                value={addForm.deadline}
                                onChange={(e) => setAddForm((f) => ({...f, deadline: e.target.value}))}
                            />
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                                onClick={() => {
                                    setAddOpen(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                onClick={onSaveAdd}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 
