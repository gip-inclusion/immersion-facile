import {
  ConnectedUserBuilder,
  DiscussionBuilder,
  type DiscussionDto,
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { makeCreateNewEvent } from "../../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type CloseDiscussionByCandidate,
  makeCloseDiscussionByCandidate,
} from "./CloseDiscussionByCandidate";

describe("CloseDiscussionByCandidate", () => {
  const candidate = new ConnectedUserBuilder()
    .withId("candidate-user-id")
    .withEmail("candidate@mail.com")
    .build();

  const otherUser = new ConnectedUserBuilder()
    .withId("other-user-id")
    .withEmail("other@mail.com")
    .build();

  const pendingDiscussion = new DiscussionBuilder()
    .withPotentialBeneficiaryEmail(candidate.email)
    .withStatus({ status: "PENDING" })
    .build();

  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let closeDiscussionByCandidate: CloseDiscussionByCandidate;

  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();
    closeDiscussionByCandidate = makeCloseDiscussionByCandidate({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        timeGateway,
        createNewEvent: makeCreateNewEvent({
          timeGateway,
          uuidGenerator: new TestUuidGenerator(),
        }),
      },
    });
  });

  describe("Wrong paths", () => {
    it("throws NotFoundError when discussion is not found", async () => {
      uow.discussionRepository.discussions = [];

      await expectPromiseToFailWithError(
        closeDiscussionByCandidate.execute(
          { discussionId: pendingDiscussion.id },
          candidate,
        ),
        errors.discussion.notFound({ discussionId: pendingDiscussion.id }),
      );
    });

    it("throws ForbiddenError when user is not the candidate of the discussion", async () => {
      uow.discussionRepository.discussions = [pendingDiscussion];

      await expectPromiseToFailWithError(
        closeDiscussionByCandidate.execute(
          { discussionId: pendingDiscussion.id },
          otherUser,
        ),
        errors.discussion.closeForbidden({
          discussionId: pendingDiscussion.id,
          userId: otherUser.id,
        }),
      );
      expectToEqual(uow.discussionRepository.discussions, [pendingDiscussion]);
      expectToEqual(uow.outboxRepository.events, []);
    });

    it.each<DiscussionDto>([
      new DiscussionBuilder(pendingDiscussion)
        .withStatus({ status: "ACCEPTED", candidateWarnedMethod: null })
        .build(),
      new DiscussionBuilder(pendingDiscussion)
        .withStatus({ status: "REJECTED", rejectionKind: "NO_TIME" })
        .build(),
      new DiscussionBuilder(pendingDiscussion)
        .withStatus({
          status: "REJECTED",
          rejectionKind: "CLOSED_BY_CANDIDATE",
        })
        .build(),
    ])(
      "throws BadRequestError when discussion has status $status and rejection kind $rejectionKind",
      async (notPendingDiscussion) => {
        uow.discussionRepository.discussions = [notPendingDiscussion];

        await expectPromiseToFailWithError(
          closeDiscussionByCandidate.execute(
            { discussionId: notPendingDiscussion.id },
            candidate,
          ),
          errors.discussion.badStatus({
            discussionId: notPendingDiscussion.id,
            expectedStatus: "PENDING",
          }),
        );
        expectToEqual(uow.discussionRepository.discussions, [
          notPendingDiscussion,
        ]);
        expectToEqual(uow.outboxRepository.events, []);
      },
    );
  });

  describe("Right path", () => {
    it("closes the pending discussion without notifying the establishment", async () => {
      uow.discussionRepository.discussions = [pendingDiscussion];
      const now = new Date("2026-09-23T10:00:00.000Z");
      timeGateway.setNextDate(now);

      await closeDiscussionByCandidate.execute(
        { discussionId: pendingDiscussion.id },
        candidate,
      );

      const expectedClosedDiscussion: DiscussionDto = {
        ...pendingDiscussion,
        status: "REJECTED",
        rejectionKind: "CLOSED_BY_CANDIDATE",
        updatedAt: now.toISOString(),
      };
      expectToEqual(uow.discussionRepository.discussions, [
        expectedClosedDiscussion,
      ]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          topic: "DiscussionStatusManuallyUpdated",
          payload: {
            discussion: expectedClosedDiscussion,
            triggeredBy: { kind: "connected-user", userId: candidate.id },
            skipSendingEmail: true,
          },
        },
      ]);
    });
  });
});
