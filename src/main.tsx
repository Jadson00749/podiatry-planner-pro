import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logAppInfo } from "./utils/debugVersion";

// Log de debug em desenvolvimento
if (import.meta.env.DEV) {
  logAppInfo();
}

createRoot(document.getElementById("root")!).render(<App />);
