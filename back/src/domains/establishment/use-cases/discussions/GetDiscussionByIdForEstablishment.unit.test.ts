import {
  AuthenticatedUser,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../../config/helpers/httpErrors";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { DiscussionBuilder } from "../../adapters/InMemoryDiscussionRepository";
import { GetDiscussionByIdForEstablishment } from "./GetDiscussionByIdForEstablishment";

const user: AuthenticatedUser = {
  id: "user-111",
  email: "user@mail.com",
  firstName: "John",
  lastName: "Doe",
  externalId: "sub-123",
};
const discussion = new DiscussionBuilder().build();
const userDiscussion = new DiscussionBuilder()
  .withEstablishmentContact({ email: user.email })
  .withId("user-discussion-id")
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
      const someId = "whatever-id";
      await expectPromiseToFailWithError(
        getDiscussionById.execute(someId),
        new UnauthorizedError(),
      );
    });

    it("throws NotFound when user cannot be found", async () => {
      const someId = "whatever-id";
      const userId = "user-404";
      await expectPromiseToFailWithError(
        getDiscussionById.execute(someId, { userId }),
        new NotFoundError(
          `Inclusion Connected user with id ${userId} not found`,
        ),
      );
    });

    it("throws NotFound when discussion cannot be found", async () => {
      const someId = "whatever-id";
      uow.authenticatedUserRepository.users = [user];
      await expectPromiseToFailWithError(
        getDiscussionById.execute(someId, {
          userId: user.id,
        }),
        new NotFoundError(`Could not find discussion with id ${someId}`),
      );
    });

    it("cannot access someone else's discussions", async () => {
      uow.authenticatedUserRepository.users = [user];
      uow.discussionRepository.discussions = [discussion];
      await expectPromiseToFailWithError(
        getDiscussionById.execute(discussion.id, {
          userId: user.id,
        }),
        new ForbiddenError(
          `You are not allowed to access discussion with id ${discussion.id}`,
        ),
      );
    });
  });

  describe("Happy path", () => {
    it("Gets the matching discussion", async () => {
      uow.authenticatedUserRepository.users = [user];
      uow.discussionRepository.discussions = [userDiscussion];
      const response = await getDiscussionById.execute(userDiscussion.id, {
        userId: user.id,
      });
      expectToEqual(response, {
        ...userDiscussion,
        potentialBeneficiary: {
          firstName: discussion.potentialBeneficiary.firstName,
          lastName: discussion.potentialBeneficiary.lastName,
          resumeLink: discussion.potentialBeneficiary.resumeLink,
        },
        establishmentContact: {
          firstName: discussion.establishmentContact.firstName,
          lastName: discussion.establishmentContact.lastName,
          job: discussion.establishmentContact.job,
          contactMethod: discussion.establishmentContact.contactMethod,
        },
      });
    });
  });
});