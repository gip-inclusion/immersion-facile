import {
  type DiscussionStatus,
  discussionStatusesSchema,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import z from "zod";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type ArchiveDiscussionsInputParams = {
  limit: number;
  lastUpdated: Date;
  statuses: DiscussionStatus[];
};

export type ArchiveDiscussions = ReturnType<typeof makeArchiveDiscussions>;

const archiveDiscussionsInputParamSchema: ZodSchemaWithInputMatchingOutput<ArchiveDiscussionsInputParams> =
  z.object({
    limit: z.int().positive(),
    lastUpdated: z.date(),
    statuses: discussionStatusesSchema,
  });

type ArchiveDiscussionsReport = {
  archivedDiscussionsQty: number;
};

export const makeArchiveDiscussions = useCaseBuilder("ArchiveDiscussions")
  .withInput(archiveDiscussionsInputParamSchema)
  .withOutput<ArchiveDiscussionsReport>()
  .build(async ({ uow, inputParams }) => {
    const discussionIdsToArchive =
      await uow.discussionRepository.getDiscussionIds({
        filters: {
          statuses: inputParams.statuses,
          updatedBetween: { to: inputParams.lastUpdated },
        },
        orderBy: "updatedAt",
        limit: inputParams.limit,
      });

    await uow.discussionRepository.archiveDiscussions(discussionIdsToArchive);

    return {
      archivedDiscussionsQty: discussionIdsToArchive.length,
    };
  });
