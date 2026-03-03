import z from "zod";
import type { ConventionId } from "../convention/convention.dto";
import type { Flavor } from "../typeFlavors";
import { zUuidLike } from "../utils/uuid";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";

export type HtmlContent = Flavor<string, "HtmlContent">;

export type HtmlToPdfRequest = {
  htmlContent: HtmlContent;
  conventionId: ConventionId;
};

const htmlContentSchema: ZodSchemaWithInputMatchingOutput<HtmlContent> = z
  .string({
    error: localization.required,
  })
  .trim()
  .min(1, localization.required);
// makeHardenedStringSchema({
//   max: MAX_HTML_SIZE, // TODO : Taille max d'un PDF toléré ?
//   canContainHtml: true, // TODO : fonctionne pas > retire beaucoup de chose qu'on a sur la page de conv
// });

export const htmlToPdfRequestSchema: ZodSchemaWithInputMatchingOutput<HtmlToPdfRequest> =
  z.object({
    htmlContent: htmlContentSchema,
    conventionId: zUuidLike,
  });
