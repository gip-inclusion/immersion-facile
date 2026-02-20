import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { internalOfferSchema } from "../search/Offer.schema";
import {
  makeHardenedStringSchema,
  zStringMinLength1,
} from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type {
  Group,
  GroupOptions,
  GroupSlug,
  GroupWithResults,
  WithGroupSlug,
} from "./group.dto";

const groupSlugSchema: ZodSchemaWithInputMatchingOutput<GroupSlug> =
  zStringMinLength1;

export const withGroupSlugSchema: ZodSchemaWithInputMatchingOutput<WithGroupSlug> =
  z.object({
    groupSlug: groupSlugSchema,
  });

//TODO Review:  Pas sûr du max et isEmptyAllowed comme legacy mais voir si on peut le retirer
const colorSchema = makeHardenedStringSchema({ max: 50, isEmptyAllowed: true });
const backgroundColorSchema = makeHardenedStringSchema({
  max: 50,
  isEmptyAllowed: true,
});

const groupOptionsSchema: ZodSchemaWithInputMatchingOutput<GroupOptions> =
  z.object({
    heroHeader: z.object({
      title: zStringMinLength1,
      description: zStringMinLength1,
      logoUrl: absoluteUrlSchema.optional(),
      backgroundColor: backgroundColorSchema.optional(),
    }),
    tintColor: colorSchema.optional(),
  });

export const groupSchema: ZodSchemaWithInputMatchingOutput<Group> = z.object({
  slug: groupSlugSchema,
  name: zStringMinLength1,
  options: groupOptionsSchema,
});

export const groupWithResultsSchema: ZodSchemaWithInputMatchingOutput<GroupWithResults> =
  z.object({
    group: groupSchema,
    results: z.array(internalOfferSchema),
  });
