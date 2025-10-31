import { addMilliseconds, subSeconds, subYears } from "date-fns";
import { DiscussionBuilder, expectToEqual } from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type ArchiveDiscussions,
  type ArchiveDiscussionsInputParams,
  makeArchiveDiscussions,
} from "./ArchiveDiscussions";

describe("DeleteOldDiscussions", () => {
  const now = new Date();
  const oneYearAgo = subYears(now, 1);
  const oneYearMinusOneMillisecondAgo = addMilliseconds(oneYearAgo, 1);
  const oneYearAndOneSecondAgo = subSeconds(oneYearAgo, 1);
  const twoYearsAgo = subYears(now, 2);
  const twoYearsAndOneSecondAgo = subSeconds(twoYearsAgo, 1);
  const twoYearsMinusOneMillisecondAgo = addMilliseconds(twoYearsAgo, 1);
  const thirtyYearsAgo = subYears(now, 30);

  let deleteOldDiscussions: ArchiveDiscussions;
  let uow: InMemoryUnitOfWork;

  const discussionRejectedOneYearAgo = new DiscussionBuilder()
    .withId("discussionRejectedOneYearAgo")
    .withStatus({ status: "REJECTED", rejectionKind: "UNABLE_TO_HELP" })
    .withUpdateDate(oneYearAgo)
    .build();
  const discussionRejectedOneYearAndOneSecondAgo = new DiscussionBuilder()
    .withId("discussionRejectedOneYearAndOneSecondAgo")
    .withStatus({
      status: "REJECTED",
      rejectionKind: "CANDIDATE_ALREADY_WARNED",
      candidateWarnedMethod: "email",
    })
    .withUpdateDate(oneYearAndOneSecondAgo)
    .build();
  const discussionRejectedThirthyYearsAgo = new DiscussionBuilder()
    .withId("discussionRejectedThirthyYearsAgo")
    .withStatus({ status: "REJECTED", rejectionKind: "UNABLE_TO_HELP" })
    .withUpdateDate(thirtyYearsAgo)
    .build();
  const discussionPendingThirthyYearsAgo = new DiscussionBuilder()
    .withId("discussionPendingThirthyYearsAgo")
    .withStatus({ status: "PENDING" })
    .withUpdateDate(thirtyYearsAgo)
    .build();
  const discussionPendingOneYearAgo = new DiscussionBuilder()
    .withId("discussionPendingOneYearAgo")
    .withStatus({ status: "PENDING" })
    .withUpdateDate(oneYearAgo)
    .build();
  const discussionPendingTwoYearsAndOneSecondAgo = new DiscussionBuilder()
    .withId("discussionPendingTwoYearsAndOneSecondAgo")
    .withStatus({ status: "PENDING" })
    .withUpdateDate(twoYearsAndOneSecondAgo)
    .build();
  const discussionAcceptedOneYearAgo = new DiscussionBuilder()
    .withId("discussionAcceptedOneYearAgo")
    .withStatus({ status: "ACCEPTED", candidateWarnedMethod: "email" })
    .withUpdateDate(oneYearAgo)
    .build();
  const discussionAcceptedTwoYearsAgo = new DiscussionBuilder()
    .withId("discussionAcceptedTwoYearsAgo")
    .withStatus({ status: "ACCEPTED", candidateWarnedMethod: "email" })
    .withUpdateDate(twoYearsAgo)
    .build();
  const discussionRejectedOneYearMinusOneMillisecondAgo =
    new DiscussionBuilder()
      .withId("discussionRejectedOneYearMinusOneMillisecondAgo")
      .withStatus({ status: "REJECTED", rejectionKind: "UNABLE_TO_HELP" })
      .withUpdateDate(oneYearMinusOneMillisecondAgo)
      .build();

  const discussionAcceptedTwoYearsMinusOneMillisecondAgo =
    new DiscussionBuilder()
      .withId("discussionAcceptedTwoYearsMinusOneMillisecondAgo")
      .withStatus({ status: "ACCEPTED", candidateWarnedMethod: "email" })
      .withUpdateDate(twoYearsMinusOneMillisecondAgo)
      .build();

  const discussionPendingTwoYearsMinusOneMillisecondAgo =
    new DiscussionBuilder()
      .withId("discussionPendingTwoYearsMinusOneMillisecondAgo")
      .withStatus({ status: "PENDING" })
      .withUpdateDate(twoYearsMinusOneMillisecondAgo)
      .build();

  const discussionAcceptedThirtyYearsAgo = new DiscussionBuilder()
    .withId("discussionAcceptedThirtyYearsAgo")
    .withStatus({ status: "ACCEPTED", candidateWarnedMethod: "email" })
    .withUpdateDate(thirtyYearsAgo)
    .build();

  beforeEach(() => {
    uow = createInMemoryUow();
    deleteOldDiscussions = makeArchiveDiscussions({
      uowPerformer: new InMemoryUowPerformer(uow),
    });
  });

  describe("Delete discussions with rejected status and updated at least one year ago", () => {
    const with10RejectedDiscussionsUpdatedOneYearAgo: ArchiveDiscussionsInputParams =
      {
        limit: 10,
        statuses: ["REJECTED"],
        lastUpdated: oneYearAgo,
      };

    it("0 discussion deleted - no discussion on repository", async () => {
      uow.discussionRepository.discussions = [];

      expectToEqual(
        await deleteOldDiscussions.execute(
          with10RejectedDiscussionsUpdatedOneYearAgo,
        ),
        {
          archivedDiscussionsQty: 0,
        },
      );

      expectToEqual(uow.discussionRepository.discussions, []);
      expectToEqual(uow.discussionRepository.archivedDiscussionIds, []);
    });

    it("0 discussion deleted - when discussions are out of update date range", async () => {
      uow.discussionRepository.discussions = [
        discussionRejectedOneYearMinusOneMillisecondAgo,
      ];

      expectToEqual(
        await deleteOldDiscussions.execute(
          with10RejectedDiscussionsUpdatedOneYearAgo,
        ),
        {
          archivedDiscussionsQty: 0,
        },
      );

      expectToEqual(uow.discussionRepository.discussions, [
        discussionRejectedOneYearMinusOneMillisecondAgo,
      ]);
      expectToEqual(uow.discussionRepository.archivedDiscussionIds, []);
    });

    it("0 discussion deleted - when discussions are in update date range and without rejected status", async () => {
      uow.discussionRepository.discussions = [
        discussionPendingOneYearAgo,
        discussionAcceptedOneYearAgo,
      ];

      expectToEqual(
        await deleteOldDiscussions.execute(
          with10RejectedDiscussionsUpdatedOneYearAgo,
        ),
        {
          archivedDiscussionsQty: 0,
        },
      );

      expectToEqual(uow.discussionRepository.discussions, [
        discussionPendingOneYearAgo,
        discussionAcceptedOneYearAgo,
      ]);
      expectToEqual(uow.discussionRepository.archivedDiscussionIds, []);
    });

    it("1 discussion deleted - when discussion is status rejected and in update date range", async () => {
      uow.discussionRepository.discussions = [discussionRejectedOneYearAgo];

      expectToEqual(
        await deleteOldDiscussions.execute(
          with10RejectedDiscussionsUpdatedOneYearAgo,
        ),
        {
          archivedDiscussionsQty: 1,
        },
      );

      expectToEqual(uow.discussionRepository.discussions, []);
      expectToEqual(uow.discussionRepository.archivedDiscussionIds, [
        discussionRejectedOneYearAgo.id,
      ]);
    });

    it("2 oldest discussions deleted with limit at 2 - but 3 discussion are rejected and in range ", async () => {
      uow.discussionRepository.discussions = [
        discussionRejectedOneYearAgo,
        discussionRejectedOneYearAndOneSecondAgo,
        discussionRejectedThirthyYearsAgo,
        discussionRejectedOneYearMinusOneMillisecondAgo,
        discussionPendingOneYearAgo,
        discussionAcceptedOneYearAgo,
      ];

      const limit = 2;

      expectToEqual(
        await deleteOldDiscussions.execute({
          ...with10RejectedDiscussionsUpdatedOneYearAgo,
          limit,
        }),
        {
          archivedDiscussionsQty: limit,
        },
      );

      expectToEqual(uow.discussionRepository.discussions, [
        discussionRejectedOneYearAgo,
        discussionRejectedOneYearMinusOneMillisecondAgo,
        discussionPendingOneYearAgo,
        discussionAcceptedOneYearAgo,
      ]);
      expectToEqual(uow.discussionRepository.archivedDiscussionIds, [
        discussionRejectedThirthyYearsAgo.id,
        discussionRejectedOneYearAndOneSecondAgo.id,
      ]);
    });
  });

  describe("Delete discussions with accepted/pending statuses and updated at least two years ago", () => {
    const with10AcceptedAndPendingDiscussionsUpdatedTwoYearsAgo: ArchiveDiscussionsInputParams =
      {
        limit: 10,
        statuses: ["ACCEPTED", "PENDING"],
        lastUpdated: twoYearsAgo,
      };

    it("0 discussion deleted - no discussion on repository", async () => {
      uow.discussionRepository.discussions = [];

      expectToEqual(
        await deleteOldDiscussions.execute(
          with10AcceptedAndPendingDiscussionsUpdatedTwoYearsAgo,
        ),
        {
          archivedDiscussionsQty: 0,
        },
      );

      expectToEqual(uow.discussionRepository.discussions, []);
      expectToEqual(uow.discussionRepository.archivedDiscussionIds, []);
    });

    it("0 discussion deleted - when discussions are out of update date range", async () => {
      uow.discussionRepository.discussions = [
        discussionAcceptedTwoYearsMinusOneMillisecondAgo,
        discussionPendingTwoYearsMinusOneMillisecondAgo,
      ];

      expectToEqual(
        await deleteOldDiscussions.execute(
          with10AcceptedAndPendingDiscussionsUpdatedTwoYearsAgo,
        ),
        {
          archivedDiscussionsQty: 0,
        },
      );

      expectToEqual(uow.discussionRepository.discussions, [
        discussionAcceptedTwoYearsMinusOneMillisecondAgo,
        discussionPendingTwoYearsMinusOneMillisecondAgo,
      ]);
      expectToEqual(uow.discussionRepository.archivedDiscussionIds, []);
    });

    it("0 discussion deleted - when discussions are in update date range and without accepted/pending status", async () => {
      uow.discussionRepository.discussions = [
        discussionRejectedThirthyYearsAgo,
      ];

      expectToEqual(
        await deleteOldDiscussions.execute(
          with10AcceptedAndPendingDiscussionsUpdatedTwoYearsAgo,
        ),
        {
          archivedDiscussionsQty: 0,
        },
      );

      expectToEqual(uow.discussionRepository.discussions, [
        discussionRejectedThirthyYearsAgo,
      ]);
      expectToEqual(uow.discussionRepository.archivedDiscussionIds, []);
    });

    it("3 discussion deleted - when discussion status is accepted/pending and in update date range", async () => {
      uow.discussionRepository.discussions = [
        discussionAcceptedOneYearAgo,
        discussionAcceptedTwoYearsAgo,
        discussionPendingTwoYearsAndOneSecondAgo,
        discussionPendingThirthyYearsAgo,
      ];

      expectToEqual(
        await deleteOldDiscussions.execute(
          with10AcceptedAndPendingDiscussionsUpdatedTwoYearsAgo,
        ),
        {
          archivedDiscussionsQty: 3,
        },
      );

      expectToEqual(uow.discussionRepository.discussions, [
        discussionAcceptedOneYearAgo,
      ]);
      expectToEqual(uow.discussionRepository.archivedDiscussionIds, [
        discussionPendingThirthyYearsAgo.id,
        discussionPendingTwoYearsAndOneSecondAgo.id,
        discussionAcceptedTwoYearsAgo.id,
      ]);
    });

    it("3 oldest discussions deleted with limit at 3 - but 4 discussion are accepted/pending and in range ", async () => {
      uow.discussionRepository.discussions = [
        discussionRejectedOneYearAgo,
        discussionRejectedOneYearAndOneSecondAgo,
        discussionRejectedThirthyYearsAgo,
        discussionRejectedOneYearMinusOneMillisecondAgo,
        discussionPendingOneYearAgo,
        discussionPendingTwoYearsAndOneSecondAgo,
        discussionPendingThirthyYearsAgo,
        discussionAcceptedOneYearAgo,
        discussionAcceptedTwoYearsAgo,
        discussionAcceptedThirtyYearsAgo,
      ];

      const limit = 3;

      expectToEqual(
        await deleteOldDiscussions.execute({
          ...with10AcceptedAndPendingDiscussionsUpdatedTwoYearsAgo,
          limit,
        }),
        {
          archivedDiscussionsQty: limit,
        },
      );

      expectToEqual(uow.discussionRepository.discussions, [
        discussionRejectedOneYearAgo,
        discussionRejectedOneYearAndOneSecondAgo,
        discussionRejectedThirthyYearsAgo,
        discussionRejectedOneYearMinusOneMillisecondAgo,
        discussionPendingOneYearAgo,
        discussionAcceptedOneYearAgo,
        discussionAcceptedTwoYearsAgo,
      ]);
      expectToEqual(uow.discussionRepository.archivedDiscussionIds, [
        discussionPendingThirthyYearsAgo.id,
        discussionAcceptedThirtyYearsAgo.id,
        discussionPendingTwoYearsAndOneSecondAgo.id,
      ]);
    });
  });
});
