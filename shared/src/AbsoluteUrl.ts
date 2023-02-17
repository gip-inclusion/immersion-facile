import { z } from "zod";

type Http = "http://" | "https://";

export type AbsoluteUrl = `${Http}${string}`;

export const absoluteUrlSchema = z
  .string()
  .regex(/^https?:\/\/.+?$/) as z.Schema<AbsoluteUrl>;

export const toAbsoluteUrl = (string: string): AbsoluteUrl =>
  !/^https?:\/\//i.test(string) ? `https://${string}` : (string as AbsoluteUrl);
