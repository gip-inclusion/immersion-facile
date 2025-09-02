import { z } from "zod/v4";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { searchResultSchema } from "../search/SearchResult.schema";
import { zStringMinLength1 } from "../zodUtils";
import type {
  Group,
  GroupOptions,
  GroupSlug,
  GroupWithResults,
  WithGroupSlug,
} from "./group.dto";

const groupSlugSchema: z.Schema<GroupSlug> = zStringMinLength1;

export const withGroupSlugSchema: z.Schema<WithGroupSlug> = z.object({
  groupSlug: groupSlugSchema,
});

const groupOptionsSchema: z.Schema<GroupOptions> = z.object({
  heroHeader: z.object({
    title: zStringMinLength1,
    description: zStringMinLength1,
    logoUrl: absoluteUrlSchema.optional(),
    backgroundColor: z.string().optional(),
  }),
  tintColor: z.string().optional(),
});

export const groupSchema: z.Schema<Group> = z.object({
  slug: groupSlugSchema,
  name: zStringMinLength1,
  options: groupOptionsSchema,
});

export const groupWithResultsSchema: z.Schema<GroupWithResults> = z.object({
  group: groupSchema,
  results: z.array(searchResultSchema),
});
