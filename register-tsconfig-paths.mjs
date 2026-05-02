/**
 * Pre-load before `ts-node/esm` so `@/*` resolves to `./src/*`.
 *
 *   node --import ./register-tsconfig-paths.mjs --loader ts-node/esm src/scripts/simulateFlow.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tsconfigPaths = require("tsconfig-paths");

const root = dirname(fileURLToPath(import.meta.url));
const ts = JSON.parse(readFileSync(join(root, "tsconfig.json"), "utf8"));
const co = ts.compilerOptions ?? {};
const baseUrl = join(root, co.baseUrl ?? ".");
const paths = co.paths ?? {};

tsconfigPaths.register({ baseUrl, paths });
