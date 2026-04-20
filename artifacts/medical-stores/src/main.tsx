import { createRoot } from "react-dom/client";
import App from "./App";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import "leaflet/dist/leaflet.css";
import "./index.css";

setAuthTokenGetter(() => localStorage.getItem("authToken"));

createRoot(document.getElementById("root")!).render(<App />);
