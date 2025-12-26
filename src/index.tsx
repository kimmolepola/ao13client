import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import App from "./App";
import { backendUrl } from "src/config";

console.log("backend:", backendUrl);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
