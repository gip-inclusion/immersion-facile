import z from "zod";
import type { ConventionId } from "../convention/convention.dto";
import type { Flavor } from "../typeFlavors";
import { makeHardenedStringSchema } from "../utils/string.schema";
import { zUuidLike } from "../utils/uuid";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";

export type HtmlContent = Flavor<string, "HtmlContent">;

export type HtmlToPdfRequest = {
  htmlContent: HtmlContent;
  conventionId: ConventionId;
};

const htmlContentSchema: ZodSchemaWithInputMatchingOutput<HtmlContent> =
  makeHardenedStringSchema({
    max: 10000,
    // TODO : en prod on a des messages à 653522
    // comment on peut gérer ça si on reprend à
    // chaque fois les historique de mail dans les réponses ?
    isHtml: true,
  });

export const htmlToPdfRequestSchema: ZodSchemaWithInputMatchingOutput<HtmlToPdfRequest> =
  z.object({
    htmlContent: htmlContentSchema,
    conventionId: zUuidLike,
  });
