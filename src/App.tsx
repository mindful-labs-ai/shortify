import { useEffect } from "react";
import DropView from "./pages/DropView";
import ImageConceptPicker from "./pages/ImageConceptPicker";
import JobProgressBoard from "./pages/JobProgressBoard";
import SettingsPage from "./pages/Settings";
import TocCheckList from "./pages/TocCheckList";
import VideoLibrary from "./pages/VideoLibrary";
import { setApiConfig } from "./lib/api";
import { tauri } from "./lib/tauri";
import { useAppStore } from "./store";

function NavBar() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  const tab = (key: typeof view, label: string) => (
    <button
      type="button"
      onClick={() => setView(key)}
      className={[
        "rounded-full px-3 py-1.5 text-sm transition",
        view === key
          ? "bg-neutral-900 text-white"
          : "text-neutral-600 hover:text-neutral-900",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <nav className="sticky top-0 z-30 flex items-center gap-2 border-b border-neutral-200 bg-white/80 px-6 py-3 backdrop-blur">
      <span className="mr-3 text-sm font-semibold tracking-tight">Shortify</span>
      {tab("drop", "Drop")}
      {tab("library", "Library")}
      {tab("settings", "Settings")}
    </nav>
  );
}

export default function App() {
  const view = useAppStore((s) => s.view);

  useEffect(() => {
    tauri
      .getApiConfig()
      .then(setApiConfig)
      .catch((e) => console.error("Failed to get API config:", e));
  }, []);

  return (
    <main className="min-h-screen">
      <NavBar />
      {view === "drop" && <DropView />}
      {view === "toc" && <TocCheckList />}
      {view === "image_picker" && <ImageConceptPicker />}
      {view === "progress" && <JobProgressBoard />}
      {view === "library" && <VideoLibrary />}
      {view === "settings" && <SettingsPage />}
    </main>
  );
}
