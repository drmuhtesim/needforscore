import fs from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Replaces the literal token __BUILD_ID__ inside the emitted public/sw.js
 * with a fresh value on every production build. CACHE_NAME therefore
 * changes per deploy, the new SW activates a fresh cache, and the old
 * cache is purged on activate.
 */
function swVersionPlugin(): Plugin {
  const buildId = `b${Date.now().toString(36)}`;
  let outDir = "dist";

  const stampServiceWorker = (filePath: string) => {
    if (!fs.existsSync(filePath)) return;
    const source = fs.readFileSync(filePath, "utf8");
    fs.writeFileSync(filePath, source.replace(/__BUILD_ID__/g, buildId));
  };

  return {
    name: "sw-version",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (fileName !== "sw.js" && fileName !== "service-worker.js") continue;
        const asset = bundle[fileName];
        if (asset.type === "asset" && typeof asset.source === "string") {
          asset.source = asset.source.replace(/__BUILD_ID__/g, buildId);
        }
      }
    },
    closeBundle() {
      const root = path.resolve(__dirname, outDir);
      stampServiceWorker(path.join(root, "sw.js"));
      stampServiceWorker(path.join(root, "service-worker.js"));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    swVersionPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));