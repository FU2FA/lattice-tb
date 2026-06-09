import { App } from "./app/App";
import "katex/dist/katex.min.css";
import "./style.css";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("#app element not found");
}

const app = new App(root);
app.start();
