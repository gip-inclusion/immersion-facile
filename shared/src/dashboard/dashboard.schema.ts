import { z } from "zod";
import { DashboardName, dashboardNames } from "./dashboard.dto";

export const dashboardNameSchema: z.Schema<DashboardName> =
  z.enum(dashboardNames);
