import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { searchResultSchema } from "../search/SearchResult.schema";
import { zStringMinLength1 } from "../zodUtils";
import { Group, GroupWithResults, WithGroupSlug } from "./group.dto";

const groupSlugSchema = zStringMinLength1;

export const withGroupSlugSchema: z.Schema<WithGroupSlug> = z.object({
  groupSlug: groupSlugSchema,
});

const groupOptionsSchema = z.object({
  heroHeader: z.object({
    title: zStringMinLength1,
    description: zStringMinLength1,
    logoUrl: absoluteUrlSchema,
    backgroundColor: z.string().optional(),
  }),
  tintColor: z.string(),
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
