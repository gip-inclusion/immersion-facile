import { z } from "zod";

import { conventionIdSchema } from "../convention/convention.schema";

import {
  GetAdminDashboardParams,
  GetConventionMagicLinkDashboardParams,
  ManageConventionAdminForm,
  simpleDashboardNames,
} from "./dashboard.dto";

export const getAdminDashboardParamsSchema: z.Schema<GetAdminDashboardParams> =
  z.union([
    z.object({
      name: z.enum(simpleDashboardNames),
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

export const manageConventionAdminFormSchema: z.Schema<ManageConventionAdminForm> =
  z.object({
    conventionId: conventionIdSchema,
  });
