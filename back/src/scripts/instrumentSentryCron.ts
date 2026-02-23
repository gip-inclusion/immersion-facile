import type { Environment } from "shared";
import { configureSentry } from "./configureSentry";

const envType = (process.env.ENV_TYPE ?? "local") as Environment;
configureSentry(envType, { traceRate: 1 });
