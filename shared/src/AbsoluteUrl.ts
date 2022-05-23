import { z } from "zod";

type Http = "http://" | "https://";

export type AbsoluteUrl = `${Http}${string}`;

export const absoluteUrlSchema = z
  .string()
  .regex(/^https?:\/\/.+?$/) as z.Schema<AbsoluteUrl>;
