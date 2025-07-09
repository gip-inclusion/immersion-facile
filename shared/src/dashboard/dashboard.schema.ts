import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import {
  allDashboardNames,
  type DashboardUrlAndName,
  type GetAdminDashboardParams,
  type GetConventionMagicLinkDashboardParams,
  simpleDashboardNames,
} from "./dashboard.dto";

export const getAdminDashboardParamsSchema: z.Schema<GetAdminDashboardParams> =
  z.union([
    z.object({
      name: z.enum(simpleDashboardNames),
    }),
    z.object({
      name: z.enum(["adminAgencyDetails"]),
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
