import { setBaseUrl } from "@workspace/api-client-react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import "leaflet/dist/leaflet.css";
import "./index.css";
const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? null;
setBaseUrl(apiBaseUrl);
setAuthTokenGetter(() => localStorage.getItem("authToken"));

createRoot(document.getElementById("root")!).render(<App />);
