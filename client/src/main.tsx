import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

const root = createRoot(document.getElementById("root")!);

function render() {
  root.render(
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

render();

// Enable HMR
if (import.meta.hot) {
  import.meta.hot.accept(['./App'], () => {
    render();
  });
}
