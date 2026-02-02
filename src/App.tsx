import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AIProvider, useAI } from "./contexts/AIContext";
import { LoadingScreen } from "./components/common/LoadingScreen";
import { ErrorScreen } from "./components/common/ErrorScreen";
import { HomePage } from "./pages/HomePage";
import { WritePage } from "./pages/WritePage";
import { DetailPage } from "./pages/DetailPage";
import { EditPage } from "./pages/EditPage";
import { CalendarPage } from "./pages/CalendarPage";
import { StatsPage } from "./pages/StatsPage";

function AppContent() {
  const { status, progress, progressText, error } = useAI();

  if (status === "loading" || status === "idle") {
    return <LoadingScreen progress={progress} progressText={progressText} />;
  }

  if (status === "error") {
    return (
      <ErrorScreen
        message={error || "알 수 없는 오류가 발생했습니다."}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/write" element={<WritePage />} />
      <Route path="/write/:date" element={<WritePage />} />
      <Route path="/entry/:id" element={<DetailPage />} />
      <Route path="/edit/:id" element={<EditPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/stats" element={<StatsPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AIProvider>
        <AppContent />
      </AIProvider>
    </BrowserRouter>
  );
}

export default App;
