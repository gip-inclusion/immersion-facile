import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { internalOfferSchema } from "../search/Offer.schema";
import {
  type ZodSchemaWithInputMatchingOutput,
  zStringMinLength1,
} from "../zodUtils";
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

const groupOptionsSchema: ZodSchemaWithInputMatchingOutput<GroupOptions> =
  z.object({
    heroHeader: z.object({
      title: zStringMinLength1,
      description: zStringMinLength1,
      logoUrl: absoluteUrlSchema.optional(),
      backgroundColor: z.string().optional(),
    }),
    tintColor: z.string().optional(),
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
