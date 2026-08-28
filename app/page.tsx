"use client";

import { useEffect } from "react";
import { AllCasesScreen } from "@/components/AllCasesScreen";
import { AppScreen } from "@/components/AppScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { NewCaseScreen } from "@/components/NewCaseScreen";
import { SherlockProvider, useSherlock } from "@/lib/store";

function Sherlock() {
  const { screen } = useSherlock();

  /* The casefile lives in memory only, so a file dropped anywhere outside the
     Upload tab's drop zone would navigate the tab to the file and take the
     whole inspection with it. Swallow those drops. */
  useEffect(() => {
    const swallow = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", swallow);
    window.addEventListener("drop", swallow);
    return () => {
      window.removeEventListener("dragover", swallow);
      window.removeEventListener("drop", swallow);
    };
  }, []);

  return (
    <div
      className="sh-app"
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    >
      {screen === "home" && <HomeScreen />}
      {screen === "cases" && <AllCasesScreen />}
      {screen === "newcase" && <NewCaseScreen />}
      {screen === "app" && <AppScreen />}
    </div>
  );
}

export default function Page() {
  return (
    <SherlockProvider>
      <Sherlock />
    </SherlockProvider>
  );
}
