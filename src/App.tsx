import { useEffect } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { HomePage } from "./screens/HomePage";
import { SetupPage } from "./screens/SetupPage";
import { MatchPage } from "./screens/MatchPage";
import { ViewerPage } from "./screens/ViewerPage";
import { HistoryPage } from "./screens/HistoryPage";
import { TeamPage } from "./screens/TeamPage";
import { SettingsGraphicsPage, SettingsPage, SettingsThemesPage } from "./screens/SettingsPages";
import { AccountPage } from "./screens/AccountPage";
import { useAccount } from "./state/account";
import { usePremium } from "./state/premium";
import { ToastHost } from "./ui/Toast";
import { legacyLivePath } from "./live/legacy";

export function App() {
  const hydratePremium = usePremium((state) => state.hydrate);
  const bootAccount = useAccount((state) => state.boot);
  const [params] = useSearchParams();
  const legacyTo = legacyLivePath(params);

  useEffect(() => {
    hydratePremium();
    bootAccount();
  }, [hydratePremium, bootAccount]);

  if (legacyTo) {
    return (
      <>
        <Navigate to={legacyTo} replace />
        <ToastHost />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/match" element={<MatchPage />} />
        <Route path="/g/:gameId" element={<ViewerPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/themes" element={<SettingsThemesPage />} />
        <Route path="/settings/graphics" element={<SettingsGraphicsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastHost />
    </>
  );
}
