import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Upload from "./pages/Upload.jsx";
import Summary from "./pages/Summary.jsx";
import Layout from "./components/Layout.jsx";

// Auth is disabled; this wrapper is just a pass-through
function Protected({ children }) { return children; }

export default function App() {
  return (
    <Routes>
      {/* All routes share the universal header via Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route
          path="/upload"
          element={
            <Protected>
              <Upload />
            </Protected>
          }
        />
        <Route
          path="/summary"
          element={
            <Protected>
              <Summary model={"openai"}/>
            </Protected>
          }
        /><Route
          path="/summary/gemini"
          element={
              <Protected>
                  <Summary model={"gemini"}/>
              </Protected>
          }
      /><Route
          path="/summary/claude"
          element={
              <Protected>
                  <Summary model={"claude"}/>
              </Protected>
          }
      />
      </Route>

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}