import { z } from "zod/v4";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import {
  type DashboardUrlAndName,
  type GetAdminDashboardParams,
  type GetConventionMagicLinkDashboardParams,
  allDashboardNames,
  simpleDashboardNames,
} from "./dashboard.dto";

export const getAdminDashboardParamsSchema: z.Schema<GetAdminDashboardParams> =
  z.union([
    z.object({
      name: z.enum(simpleDashboardNames),
    }),
    z.object({
      name: z.enum(["agencyForAdmin"]),
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

export const dashboardUrlAndNameSchema: z.Schema<DashboardUrlAndName> =
  z.object({
    name: z.enum(allDashboardNames),
    url: absoluteUrlSchema,
  });
