import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      // Use babel for JSX transformation
      babel: {
        plugins: [],
      },
    }),
  ],
  server: {
    port: 3001,
    open: true,
  },
});
