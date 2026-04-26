import { useEffect } from "react";
import DropView from "./pages/DropView";
import ImageConceptPicker from "./pages/ImageConceptPicker";
import JobProgressBoard from "./pages/JobProgressBoard";
import SettingsPage from "./pages/Settings";
import TocCheckList from "./pages/TocCheckList";
import VideoLibrary from "./pages/VideoLibrary";
import Sidebar from "./components/layout/Sidebar";
import { setApiConfig } from "./lib/api";
import { tauri } from "./lib/tauri";
import { useAppStore } from "./store";

export default function App() {
  const view = useAppStore((s) => s.view);

  useEffect(() => {
    tauri
      .getApiConfig()
      .then(setApiConfig)
      .catch((e) => console.error("Failed to get API config:", e));
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto" }}>
        {view === "drop" && <DropView />}
        {view === "toc" && <TocCheckList />}
        {view === "image_picker" && <ImageConceptPicker />}
        {view === "progress" && <JobProgressBoard />}
        {view === "library" && <VideoLibrary />}
        {view === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
