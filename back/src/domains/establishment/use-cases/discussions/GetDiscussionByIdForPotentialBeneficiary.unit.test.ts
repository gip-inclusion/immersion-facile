import {
  ConnectedUserBuilder,
  DiscussionBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type GetDiscussionByIdForPotentialBeneficiary,
  makeGetDiscussionByIdForPotentialBeneficiary,
} from "./GetDiscussionByIdForPotentialBeneficiary";

describe("GetDiscussionByIdForPotentialBeneficiary use case", () => {
  const discussion = new DiscussionBuilder().withId(uuid()).build();

  const potentialBeneficiaryUser = new ConnectedUserBuilder()
    .withId(uuid())
    .withEmail(discussion.potentialBeneficiary.email)
    .buildUser();

  const anotherUser = new ConnectedUserBuilder().withId(uuid()).buildUser();

  let getDiscussionByIdForPotentialBeneficiary: GetDiscussionByIdForPotentialBeneficiary;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getDiscussionByIdForPotentialBeneficiary =
      makeGetDiscussionByIdForPotentialBeneficiary({
        uowPerformer: new InMemoryUowPerformer(uow),
      });
    uow.userRepository.users = [potentialBeneficiaryUser, anotherUser];
    uow.discussionRepository.discussions = [discussion];
  });

  describe("Wrong paths", () => {
    describe("throws NotFound", () => {
      it("when user cannot be found", async () => {
        uow.userRepository.users = [];
        await expectPromiseToFailWithError(
          getDiscussionByIdForPotentialBeneficiary.execute(discussion.id, {
            userId: potentialBeneficiaryUser.id,
          }),
          errors.user.notFound({ userId: potentialBeneficiaryUser.id }),
        );
      });

      it("when discussion cannot be found", async () => {
        const missingDiscussionId = uuid();

        await expectPromiseToFailWithError(
          getDiscussionByIdForPotentialBeneficiary.execute(
            missingDiscussionId,
            {
              userId: potentialBeneficiaryUser.id,
            },
          ),
          errors.discussion.notFound({ discussionId: missingDiscussionId }),
        );
      });
    });

    it("throws accessForbidden when user email differs from potential beneficiary email", async () => {
      await expectPromiseToFailWithError(
        getDiscussionByIdForPotentialBeneficiary.execute(discussion.id, {
          userId: anotherUser.id,
        }),
        errors.discussion.accessForbidden({
          discussionId: discussion.id,
          userId: anotherUser.id,
        }),
      );
    });
  });

  describe("Right paths", () => {
    describe("Discussion with kinds and methods", () => {
      it.each([
        new DiscussionBuilder(discussion)
          .withDiscussionKind("IF")
          .withContactMode("EMAIL")
          .build(),
        new DiscussionBuilder(discussion)
          .withDiscussionKind("IF")
          .withContactMode("IN_PERSON")
          .build(),
        new DiscussionBuilder(discussion)
          .withDiscussionKind("IF")
          .withContactMode("PHONE")
          .build(),
        new DiscussionBuilder(discussion)
          .withDiscussionKind("1_ELEVE_1_STAGE")
          .withContactMode("EMAIL")
          .build(),
        new DiscussionBuilder(discussion)
          .withDiscussionKind("1_ELEVE_1_STAGE")
          .withContactMode("IN_PERSON")
          .build(),
        new DiscussionBuilder(discussion)
          .withDiscussionKind("1_ELEVE_1_STAGE")
          .withContactMode("PHONE")
          .build(),
      ])("Gets discussion with kind $kind and contact mode $contactMode based on potential beneficiary email", async (discussion) => {
        uow.discussionRepository.discussions = [discussion];

        expectToEqual(
          await getDiscussionByIdForPotentialBeneficiary.execute(
            discussion.id,
            {
              userId: potentialBeneficiaryUser.id,
            },
          ),
          new DiscussionBuilder(discussion).buildRead(),
        );
      });
    });
  });
});
