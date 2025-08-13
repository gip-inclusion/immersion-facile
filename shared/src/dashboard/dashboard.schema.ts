import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import {
  allDashboardNames,
  type DashboardUrlAndName,
  type GetAdminDashboardParams,
  type GetConventionMagicLinkDashboardParams,
  simpleDashboardNames,
} from "./dashboard.dto";

export const getAdminDashboardParamsSchema: ZodSchemaWithInputMatchingOutput<GetAdminDashboardParams> =
  z.union([
    z.object({
      name: z.enum(simpleDashboardNames, {
        error: localization.invalidEnum,
      }),
    }),
    z.object({
      name: z.enum(["adminAgencyDetails"], {
        error: localization.invalidEnum,
      }),
      agencyId: z.string(),
    }),
  ]);

export const getConventionMagicLinkDashboardParamsSchema: ZodSchemaWithInputMatchingOutput<GetConventionMagicLinkDashboardParams> =
  z.object({
    name: z.enum(["conventionStatus"], {
      error: localization.invalidEnum,
    }),
    conventionId: z.string(),
  });

export const getDashboardParams = z.union([
  getAdminDashboardParamsSchema,
  getConventionMagicLinkDashboardParamsSchema,
]);

export const dashboardUrlAndNameSchema: ZodSchemaWithInputMatchingOutput<DashboardUrlAndName> =
  z.object({
    name: z.enum(allDashboardNames, {
      error: localization.invalidEnum,
    }),
    url: absoluteUrlSchema,
  });
