import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function cleanRouteTree() {
  const filePath = path.resolve(__dirname, "./src/routeTree.gen.js");
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    if (content.includes("import type")) {
      fs.writeFileSync(filePath, content.replace(/import\s+type\s+[\s\S]*$/, "").trimEnd() + "\n", "utf-8");
    }
  }
}

cleanRouteTree();

export default defineConfig({
  plugins: [
    {
      name: "clean-route-tree-js",
      enforce: "pre",
      buildStart() {
        cleanRouteTree();
      },
      transform(code, id) {
        if (id.includes("routeTree.gen.js") && code.includes("import type")) {
          cleanRouteTree();
          return {
            code: code.replace(/import\s+type\s+[\s\S]*$/, "").trimEnd() + "\n",
            map: null,
          };
        }
      },
    },
    react(),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.{test,spec}.{js,jsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
