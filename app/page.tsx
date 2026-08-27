"use client";

import { AllCasesScreen } from "@/components/AllCasesScreen";
import { AppScreen } from "@/components/AppScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { NewCaseScreen } from "@/components/NewCaseScreen";
import { SherlockProvider, useSherlock } from "@/lib/store";

function Sherlock() {
  const { screen } = useSherlock();

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
