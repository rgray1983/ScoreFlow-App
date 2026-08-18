import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./screens/HomePage";
import { SetupPage } from "./screens/SetupPage";
import { MatchPage } from "./screens/MatchPage";
import { ViewerPage } from "./screens/ViewerPage";
import { HistoryPage } from "./screens/HistoryPage";
import { TeamPage } from "./screens/TeamPage";
import { SettingsGraphicsPage, SettingsPage, SettingsThemesPage } from "./screens/SettingsPages";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/match" element={<MatchPage />} />
      <Route path="/g/:gameId" element={<ViewerPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/themes" element={<SettingsThemesPage />} />
      <Route path="/settings/graphics" element={<SettingsGraphicsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
