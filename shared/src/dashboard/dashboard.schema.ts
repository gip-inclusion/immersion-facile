import { z } from "zod";
import {
  GetAdminDashboardParams,
  GetConventionMagicLinkDashboardParams,
  simpleDashboardKinds,
} from "./dashboard.dto";

export const getAdminDashboardParamsSchema: z.Schema<GetAdminDashboardParams> =
  z.union([
    z.object({
      name: z.enum(simpleDashboardKinds),
    }),
    z.object({
      name: z.enum(["agency"]),
      agencyId: z.string(),
    }),
  ]);

export const getConventionMagicLinkDashboardParamsSchema: z.Schema<GetConventionMagicLinkDashboardParams> =
  z.object({
    name: z.enum(["conventionStatus"]),
    conventionId: z.string(),
  });

export const getDashboardParams = z.union([
  getAdminDashboardParamsSchema,
  getConventionMagicLinkDashboardParamsSchema,
]);
