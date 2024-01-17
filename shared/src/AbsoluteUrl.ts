import { z } from "zod";

type Http = "http://" | "https://";

export type AbsoluteUrl = `${Http}${string}`;

export const absoluteUrlSchema: z.Schema<AbsoluteUrl> = z
  .string()
  .regex(
    /^https?:\/\/.+?$/,
    "Le format de saisie est invalide. Exemple : https://docs.google.com/mon-url",
  ) as z.Schema<AbsoluteUrl>;

export const toAbsoluteUrl = (url: string): AbsoluteUrl =>
  !/^https?:\/\//i.test(url) ? `https://${url}` : (url as AbsoluteUrl);
