import {
  DiscussionBuilder,
  User,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";

import { GetDiscussionByIdForEstablishment } from "./GetDiscussionByIdForEstablishment";

import { v4 as uuid } from "uuid";

const user: User = {
  id: "user-111",
  email: "user@mail.com",
  firstName: "John",
  lastName: "Doe",
  externalId: "sub-123",
  createdAt: new Date().toISOString(),
};
const discussion = new DiscussionBuilder().build();
const userDiscussion = new DiscussionBuilder()
  .withEstablishmentContact({ email: user.email })
  .withId(uuid())
  .build();
const userOnCopyEmailsDiscussion = new DiscussionBuilder()
  .withEstablishmentContact({ copyEmails: [user.email] })
  .withId(uuid())
  .build();

const userBothOnCopyEmailsAndContactEmailDiscussion = new DiscussionBuilder()
  .withEstablishmentContact({ copyEmails: [user.email], email: user.email })
  .withId(uuid())
  .build();

describe("GetDiscussionById use case", () => {
  let getDiscussionById: GetDiscussionByIdForEstablishment;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);

    getDiscussionById = new GetDiscussionByIdForEstablishment(uowPerformer);
  });

  describe("Failure cases", () => {
    it("cannot process if no jwt provided", async () => {
      await expectPromiseToFailWithError(
        getDiscussionById.execute(uuid()),
        errors.user.unauthorized(),
      );
    });

    it("throws NotFound when user cannot be found", async () => {
      const userId = "user-404";
      await expectPromiseToFailWithError(
        getDiscussionById.execute(uuid(), { userId }),
        errors.user.notFound({ userId }),
      );
    });

    it("throws NotFound when discussion cannot be found", async () => {
      const discussionId = uuid();
      uow.userRepository.users = [user];
      await expectPromiseToFailWithError(
        getDiscussionById.execute(discussionId, {
          userId: user.id,
        }),
        errors.discussion.notFound({ discussionId }),
      );
    });

    it("cannot access someone else's discussions", async () => {
      uow.userRepository.users = [user];
      uow.discussionRepository.discussions = [discussion];
      await expectPromiseToFailWithError(
        getDiscussionById.execute(discussion.id, {
          userId: user.id,
        }),
        errors.discussion.accessForbidden({
          discussionId: discussion.id,
          userId: user.id,
        }),
      );
    });
  });

  describe("Happy path", () => {
    it("Gets the matching discussion based on establishment contact email", async () => {
      uow.userRepository.users = [user];
      uow.discussionRepository.discussions = [userDiscussion];
      const response = await getDiscussionById.execute(userDiscussion.id, {
        userId: user.id,
      });
      expectToEqual(
        response,
        new DiscussionBuilder(userDiscussion).buildRead(),
      );
    });
    it("Gets the matching discussion based on establishment copy emails", async () => {
      uow.userRepository.users = [user];
      uow.discussionRepository.discussions = [userOnCopyEmailsDiscussion];
      const response = await getDiscussionById.execute(
        userOnCopyEmailsDiscussion.id,
        {
          userId: user.id,
        },
      );
      expectToEqual(
        response,
        new DiscussionBuilder(userOnCopyEmailsDiscussion).buildRead(),
      );
    });
    it("Gets the matching discussion based on establishment copy emails and contact email", async () => {
      uow.userRepository.users = [user];
      uow.discussionRepository.discussions = [
        userBothOnCopyEmailsAndContactEmailDiscussion,
      ];
      const response = await getDiscussionById.execute(
        userBothOnCopyEmailsAndContactEmailDiscussion.id,
        {
          userId: user.id,
        },
      );
      expectToEqual(
        response,
        new DiscussionBuilder(
          userBothOnCopyEmailsAndContactEmailDiscussion,
        ).buildRead(),
      );
    });
  });
});
