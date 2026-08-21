import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/anton/400.css";
import "./ui/base.css";
import { App } from "./App";
import { routerBasename } from "./lib/base";
import { registerPwa } from "./pwa/register";
import { applyStandaloneShell } from "./pwa/viewport";

applyStandaloneShell();
registerPwa();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
