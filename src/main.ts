import "./styles/main.css";

import { bootstrap } from "./app/bootstrap";

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup failure";
  document.body.textContent = `Withering Despots could not start: ${message}`;
  throw error;
});
