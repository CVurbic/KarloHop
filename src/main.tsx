import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root")!;

// #root always ships a <noscript> SEO fallback (see index.html), so it's
// never actually empty — hasChildNodes()-based hydrateRoot detection was
// firing unconditionally with no real prerendered markup to match,
// causing a bogus hydration-mismatch warning. No prerendering (react-snap
// etc.) is wired up in this project, so plain createRoot is correct.
createRoot(root).render(<App />);
