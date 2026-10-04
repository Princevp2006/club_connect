// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs";
import path from "node:path";
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
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.js (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    router: {
      generatedRouteTree: "routeTree.gen.js",
      disableTypes: true,
    },
  },
  vite: {
    plugins: [
      {
        name: "clean-route-tree-js",
        enforce: "pre",
        buildStart() {
          cleanRouteTree();
        },
        buildEnd() {
          cleanRouteTree();
        },
        closeBundle() {
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
    ],
  },
});
