import { z } from "zod";
import { GetDashboardParams, simpleDashboardNames } from "./dashboard.dto";

export const getDashboardParamsSchema: z.Schema<GetDashboardParams> = z.union([
  z.object({
    name: z.enum(simpleDashboardNames),
  }),
  z.object({
    name: z.enum(["agency"]),
    agencyId: z.string(),
  }),
]);
