import React, { forwardRef } from "react";

const IMAGE_HEIGHT = 240; // reduce image size in PDF
const IMAGES_PER_PAGE = 4; // 2 columns x 3 rows

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < (arr || []).length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Printable-only layout (used by react-to-print)
 * IMPORTANT: must forwardRef so Summary.jsx can print it.
 */
const PrintReport = forwardRef(function PrintReport(
  {
    meta,
    counts,
    perImage,
    obsRows,
    hazardRowsDerived,
    findings,
    areaRatings,
    avgScore,
    imgURL,
  },
  ref
) {
  const safe = (v) => (v ?? "").toString().trim() || "—";
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

    const recommendationsHighSeverityOnly = getNormalizedRecommendationsArray(perImageItem);
    const hasHighSeverityRecommendations = recommendationsHighSeverityOnly.length > 0;

    const hasAnyRecommendations = hasHighSeverityRecommendations;

    const severityLevel = ((perImageItem?.severity_level ?? perImageItem?.severity ?? "") + "").toLowerCase();
    const priorityLevel = ((perImageItem?.priority ?? "") + "").toLowerCase();
    const isHighOrExtremeSeverity = severityLevel === "high" || severityLevel === "extreme";
    const isImmediateOrCriticalPriority =
      priorityLevel === "immediate action required" || priorityLevel === "critical";

    if (hasRustStainsTag) return "rust";
    if (hasHighSeverityRecommendations || hasAnyRecommendations || isHighOrExtremeSeverity || isImmediateOrCriticalPriority) return "attention";
    return "none";
  };

    const derivedCounts = (() => {
    const perImageList = Array.isArray(perImage) ? perImage : [];
    let fireHazardCount = 0;
    let tripFallCount = 0;
    let satisfactoryCount = 0;
    for (const item of perImageList) {
      const effectiveCondition = resolveEffectiveCondition(item);
      if (effectiveCondition === "fire_hazard") fireHazardCount += 1;
      else if (effectiveCondition === "trip_fall") tripFallCount += 1;
      else if (effectiveCondition === "none") satisfactoryCount += 1;
      // rust/attention are intentionally not part of the main 3 KPI boxes (you can add later if needed)
    }
    return { fireHazardCount, tripFallCount, satisfactoryCount };
  })();



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

  const photoPages = chunk(perImage || [], IMAGES_PER_PAGE);

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
          .print-root { width: 100% !important; }
          .no-break { break-inside: avoid; page-break-inside: avoid; }
          h1, h2, h3, p, table, tr, td, th, img { break-inside: avoid; page-break-inside: avoid; }
          h1, h2, h3, img { break-inside: avoid; page-break-inside: avoid; }
          table { break-inside: auto; page-break-inside: auto; }
          .wrap { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
          tr { break-inside: avoid; page-break-inside: avoid; }
          img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }

        /* Layout */
        .page-pad { padding: 18px 18px; }
        .muted { color: #4B5563; }
        .rule { margin: 14px 0; border: none; border-top: 1px solid #E5E7EB; }

        /* Header */
        .hdr {
          border: 1px solid #DBEAFE;
          background: #EFF6FF;
          border-radius: 14px;
          padding: 14px 14px;
        }
        .hdrTitle { font-size: 22px; font-weight: 900; color: #0F172A; }
        .hdrSub { margin-top: 6px; font-size: 12px; color: #475569; }
        .hdrMeta { font-size: 12px; color: #334155; text-align: right; }

        /* Grids */
        .twoCol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; font-size: 12px; }
        .kpiGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }

        /* KPI cards */
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

        /* Section titles */
        .secTitle { font-size: 14px; font-weight: 900; color: #0F172A; }
        .secNote { font-size: 12px; color: #475569; }

        /* Tables */
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

        /* Photos */
        .imgGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .imgCard { border: 1px solid #E5E7EB; border-radius: 12px; padding: 8px; background: #FFFFFF; }
        .img {
          width: 100%;
          height: ${IMAGE_HEIGHT}px;
          object-fit: contain;
          background: #F8FAFC;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
          display: block;
        }
        .thumb {
          width: 96px;
          height: 64px;
          object-fit: cover;
          background: #F8FAFC;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
          display: block;
        }
        .defGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .defCard { border: 1px solid #E5E7EB; border-radius: 12px; padding: 10px; background: #FFFFFF; }
        .defHdr { display: flex; gap: 10px; align-items: flex-start; }
        .defMeta { font-size: 11px; color: #334155; line-height: 1.35; }
        .defRec { margin-top: 8px; font-size: 11px; color: #374151; line-height: 1.35; }
        .defImg {
          width: 100%;
          height: ${IMAGE_HEIGHT}px;
          object-fit: contain;
          background: #F8FAFC;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
          display: block;
        }

      `}</style>

      {/* PAGE 1 */}
      <div className="print-page page-pad">
        <div className="hdr no-break" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div className="hdrTitle">Vessel Inspection Report</div>
            <div className="hdrSub">Generated by iShip Inspection AI</div>
          </div>
          <div className="hdrMeta">
            <div><b>Report Ref:</b> {safe(meta?.reportRef)}</div>
            <div><b>Date:</b> {safe(meta?.date)}</div>
            <div><b>Location:</b> {safe(meta?.location)}</div>
          </div>
        </div>

        <hr className="rule" />

        <div className="twoCol no-break">
          <div><b>Vessel Name:</b> {safe(meta?.vesselName)}</div>
          <div><b>Inspector:</b> {safe(meta?.inspector)}</div>
          <div><b>IMO:</b> {safe(meta?.imo)}</div>
          <div><b>Flag:</b> {safe(meta?.flag)}</div>
          <div><b>Call Sign:</b> {safe(meta?.callSign)}</div>
          <div><b>Weather:</b> {safe(meta?.weather)}</div>
        </div>

        <hr className="rule" />

        <div className="kpiGrid no-break">
          <div className="kpiBox kpiFire">
            <div className="kpiLabel">Fire hazards</div>
            <div className="kpiValue">{derivedCounts.fireHazardCount}</div>
          </div>
          <div className="kpiBox kpiTrip">
            <div className="kpiLabel">Trip / fall</div>
            <div className="kpiValue">{derivedCounts.tripFallCount}</div>
          </div>
          <div className="kpiBox kpiOk">
            <div className="kpiLabel">Satisfactory</div>
            <div className="kpiValue">{derivedCounts.satisfactoryCount}</div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="secTitle">Executive Summary</div>
          <div style={{ marginTop: 6, fontSize: 12, whiteSpace: "pre-wrap", color: "#374151" }}>
            {safe(meta?.summaryBlurb)}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#374151" }}>
            <b>Overall Rating:</b> {safe(meta?.overallRating)}{" "}
            {typeof meta?.score === "number" ? <>(<b>Score:</b> {meta.score}/100)</> : null}
          </div>
        </div>

        <hr className="rule" />

        <div style={{ marginTop: 8 }}>
          <div className="secTitle">Findings at a Glance</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#374151" }}>
            Fire: <b>{findings?.fire ?? 0}</b> · Trip/Fall: <b>{findings?.trip ?? 0}</b> · Rust:{" "}
            <b>{findings?.rust ?? 0}</b> · Attention: <b>{findings?.attention ?? 0}</b> · Missing TS:{" "}
            <b>{findings?.missingTs ?? 0}</b>
          </div>
        </div>

        <hr className="rule" />

        <div style={{ marginTop: 8 }} className="no-break">
          <div className="secTitle">Section-wise Scorecard</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB", padding: 8 }}>Area</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB", padding: 8 }}>Score</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB", padding: 8 }}>Rating</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB", padding: 8 }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(areaRatings || {}).map(([area, data]) => (
                <tr key={area}>
                  <td style={{ borderBottom: "1px solid #F3F4F6", padding: 8 }}>{area}</td>
                  <td style={{ borderBottom: "1px solid #F3F4F6", padding: 8 }}>{data?.score ?? "—"}</td>
                  <td style={{ borderBottom: "1px solid #F3F4F6", padding: 8 }}>{data?.rating ?? "—"}</td>
                  <td style={{ borderBottom: "1px solid #F3F4F6", padding: 8 }}>{data?.remarks ?? "—"}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: 8, fontWeight: 700 }}>Average</td>
                <td style={{ padding: 8, fontWeight: 700 }}>{avgScore ?? "—"}</td>
                <td style={{ padding: 8 }} colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>

        <hr className="rule" />

        <div style={{ marginTop: 8 }} className="no-break">
          <div className="secTitle">Defects & Non-conformities</div>
            {(hazardRowsDerived || []).length === 0 ? (
              <div style={{ marginTop: 8, fontSize: 12, color: "#6B7280" }}>No defects.</div>
            ) : (
              <div className="defGrid" style={{ marginTop: 8 }}>
                {hazardRowsDerived.map((row, i) => {
                  const pid = row.photoId || row.rawId || row.id;
                  const src = imgURL && pid ? imgURL(pid) : "";
          
                  const combinedLines = (row.combined || "")
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean);
          
                  const recFromCombined = row.manual
                    ? (
                        combinedLines
                          .find((s) => /^(recs|recommendation|recommendations)\s*:/i.test(s))
                          ?.replace(/^(recs|recommendation|recommendations)\s*:\s*/i, "") || ""
                      )
                    : "";
          
                  const rec = (row.recommendations || recFromCombined || "").toString().trim() || "—";
          
                  return (
                    <div key={row.id || pid || i} className="defCard">
                    {src ? (
                      <img
                        src={src}
                        alt={pid}
                        className="defImg"
                        loading="eager"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : null}

                    <div className="defMeta" style={{ marginTop: 8 }}>
                      <div><b>#{i + 1}</b> · <b>{conditionLabel(row.condition)}</b></div>
                      <div><b>Area:</b> {row.area || "—"}</div>
                      <div><b>Assigned:</b> {row.assignedTo || "—"} · <b>Deadline:</b> {row.deadline || "—"}</div>
                    </div>
                      <div className="defRec wrap"><b>Recommendations:</b> {rec}</div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        <hr className="rule" />

        {/* Close PAGE 1 content */}
      </div>

            {/* LOCATION-WISE PHOTO FINDINGS (GROUPED) */}
      {(() => {
        const list = Array.isArray(perImage) ? perImage : [];
        const grouped = {};
        for (const it of list) {
          const loc = (it.location || "").toString().trim() || "Unspecified area";
          (grouped[loc] = grouped[loc] || []).push(it);
        }
        const entries = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));

        // If user hasn't entered any location at all, still show 1 group ("Unspecified area")
        if (!entries.length) return null;

        return entries.flatMap(([loc, items]) => {
          const pages = chunk(items, IMAGES_PER_PAGE);
          return pages.map((pageItems, pageIdx) => (
            <div key={`loc-${loc}-${pageIdx}`} className="print-page page-pad">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>Location-wise Photo Findings</div>
                  <div style={{ marginTop: 4, fontSize: 12 }} className="muted">
                    <b>Area:</b> {loc} {pages.length > 1 ? `· Part ${pageIdx + 1} of ${pages.length}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 12 }} className="muted">
                  {safe(meta?.vesselName)} · {safe(meta?.date)} · {safe(meta?.location)}
                </div>
              </div>

              <hr className="rule" />

              <div className="imgGrid">
                {pageItems.map((it) => (
                  <div key={it.id} className="imgCard no-break">
                    <div style={{ fontSize: 11, color: "#374151", marginBottom: 6 }}>
                      <b>Condition:</b> {conditionLabel(resolveEffectiveCondition(it))}
                      {it.severity_level ? <> · <b>Severity:</b> {it.severity_level}</> : null}
                      {it.priority ? <> · <b>Priority:</b> {it.priority}</> : null}
                    </div>
                    <img
                      src={imgURL ? imgURL(it.id) : ""}
                      alt={it.id}
                      className="img"
                      crossOrigin="anonymous"
                      loading="eager"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    {it.comment ? (
                      <div style={{ marginTop: 6, fontSize: 11, whiteSpace: "pre-wrap", color: "#374151" }}>
                        <b>Impact / Notes:</b> {it.comment}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ));
        });
      })()}


      {/* PHOTO APPENDIX (PAGINATED) */}
      {photoPages.length ? (
        photoPages.map((pageItems, pageIdx) => (
          <div key={`photos-page-${pageIdx}`} className="print-page page-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Photo Appendix</div>
                <div style={{ marginTop: 4, fontSize: 12 }} className="muted">
                  {safe(meta?.vesselName)} · {safe(meta?.date)} · {safe(meta?.location)}
                </div>
              </div>
              <div style={{ fontSize: 12 }} className="muted">
                Page {pageIdx + 1} of {photoPages.length}
              </div>
            </div>

            <hr className="rule" />

            <div className="imgGrid">
              {pageItems.map((it) => (
                <div key={it.id} className="imgCard no-break">
                  <div style={{ fontSize: 11, color: "#374151", marginBottom: 6 }}>
                    <b>Location:</b> {it.location || "—"} · <b>Condition:</b> {conditionLabel(resolveEffectiveCondition(it))}
                  </div>
                  <img
                    src={imgURL ? imgURL(it.id) : ""}
                    alt={it.id}
                    className="img"
                    crossOrigin="anonymous"
                    loading="eager"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Avoid broken-image icon in print
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  {it.comment ? (
                    <div style={{ marginTop: 6, fontSize: 11, whiteSpace: "pre-wrap", color: "#374151" }}>
                      <b>Comment:</b> {it.comment}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="print-page page-pad">
          <div style={{ fontSize: 18, fontWeight: 800 }}>Photo Appendix</div>
          <div style={{ marginTop: 8, fontSize: 12 }} className="muted">No photos available.</div>
        </div>
      )}
    </div>
  );
});

PrintReport.displayName = "PrintReport";

export default PrintReport;

/**
 *           // <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 12 }}>
          //   <thead>
          //     <tr>
          //       <th style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB", padding: 8 }}>#</th>
          //       <th style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB", padding: 8 }}>Area</th>
          //       <th style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB", padding: 8 }}>Photo</th>
          //       <th style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB", padding: 8 }}>Condition</th>
          //       <th style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB", padding: 8 }}>Assigned</th>
          //       <th style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB", padding: 8 }}>Deadline</th>
          //       <th style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB", padding: 8 }}>Recommendations</th>
          //     </tr>
          //   </thead>
          //   <tbody>
          //     {(hazardRowsDerived || []).length === 0 ? (
          //       <tr>
          //         <td colSpan={7} style={{ padding: 12, color: "#6B7280" }}>No defects.</td>
          //       </tr>
          //     ) : (
          //       hazardRowsDerived.map((row, i) => {
          //         const pid = row.photoId || row.rawId || row.id;
          //         const src = imgURL && pid ? imgURL(pid) : "";

          //         // ONLY recommendations (never comments). If manual rows only have `combined`, extract only the recommendation line.
          //         const combinedLines = (row.combined || "")
          //           .split("\n")
          //           .map((s) => s.trim())
          //           .filter(Boolean);

          //         const recFromCombined = row.manual
          //           ? (
          //               combinedLines
          //                 .find((s) => /^(recs|recommendation|recommendations)\s*:/i.test(s))
          //                 ?.replace(/^(recs|recommendation|recommendations)\s*:\s*i, "") ||
          //               ""
          //             )
          //           : "";

          //         const rec = (row.recommendations || recFromCombined || "").toString().trim() || "—";

          //         return (
          //           <tr key={row.id || pid || i}>
          //             <td style={{ borderBottom: "1px solid #F3F4F6", padding: 8 }}>{i + 1}</td>
          //             <td style={{ borderBottom: "1px solid #F3F4F6", padding: 8 }}>{row.area || "—"}</td>
          //             <td style={{ borderBottom: "1px solid #F3F4F6", padding: 8 }}>
          //               {src ? (
          //                 <img
          //                   src={src}
          //                   alt={pid}
          //                   className="thumb"
          //                   loading="eager"
          //                   crossOrigin="anonymous"
          //                   referrerPolicy="no-referrer"
          //                   onError={(e) => {
          //                     e.currentTarget.style.display = "none";
          //                   }}
          //                 />
          //               ) : (
          //                 <span style={{ color: "#94A3B8" }}>—</span>
          //               )}
          //             </td>
          //             <td style={{ borderBottom: "1px solid #F3F4F6", padding: 8 }}>{conditionLabel(row.condition)}</td>
          //             <td style={{ borderBottom: "1px solid #F3F4F6", padding: 8 }}>{row.assignedTo || "—"}</td>
          //             <td style={{ borderBottom: "1px solid #F3F4F6", padding: 8 }}>{row.deadline || "—"}</td>
          //             <td style={{ borderBottom: "1px solid #F3F4F6", padding: 8, whiteSpace: "pre-wrap" }}>{rec}</td>
          //           </tr>
          //         );
          //       })
          //     )}
          //   </tbody>
          // </table>
 */