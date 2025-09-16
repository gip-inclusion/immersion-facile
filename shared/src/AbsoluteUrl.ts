import { z } from "zod";
import type { ZodSchemaWithInputMatchingOutput } from "./zodUtils";

type Http = "http://" | "https://";

export type AbsoluteUrl = `${Http}${string}`;

export const absoluteUrlSchema = z
  .string()
  .trim()
  .regex(
    /^https?:\/\/.+?$/,
    "Le format de saisie est invalide. Exemple : https://www.exemple.fr/chemin-du-lien",
  ) as ZodSchemaWithInputMatchingOutput<AbsoluteUrl>;
export const absoluteUrlCanBeEmpty = absoluteUrlSchema.or(z.literal(""));

export const callbackUrlSchema: ZodSchemaWithInputMatchingOutput<AbsoluteUrl> =
  absoluteUrlSchema.refine(
    (value) =>
      !(
        value.includes("//localhost") ||
        value.includes("//127.0.0.1") ||
        value.includes("//::1")
      ),
    {
      message:
        "Le format de saisie est invalide, le lien ne doit pas être en local.",
    },
  );

export const toAbsoluteUrl = (url: string): AbsoluteUrl =>
  !/^https?:\/\//i.test(url) ? `https://${url}` : (url as AbsoluteUrl);
