import {
  ConventionDtoBuilder,
  DiscussionBuilder,
  DiscussionDto,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { NotFoundError } from "shared";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import {
  MarkDiscussionLinkedToConvention,
  makeMarkDiscussionLinkedToConvention,
} from "./MarkDiscussionLinkedToConvention";

const convention = new ConventionDtoBuilder().build();

describe("MarkDiscussionLinkedToConvention", () => {
  let markDiscussionLinkedToConvention: MarkDiscussionLinkedToConvention;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();

    const uowPerformer = new InMemoryUowPerformer(uow);
    markDiscussionLinkedToConvention = makeMarkDiscussionLinkedToConvention({
      uowPerformer,
    });
  });

  it("does nothing if discussionId is not provided", async () => {
    await markDiscussionLinkedToConvention.execute({
      convention,
    });

    expectToEqual(uow.discussionRepository.discussions, []);
  });

  it("throws NotFoundError if discussion is not found", async () => {
    const discussion = new DiscussionBuilder()
      .withSiret("11110000222200")
      .build();

    await expectPromiseToFailWithError(
      markDiscussionLinkedToConvention.execute({
        convention,
        discussionId: discussion.id,
      }),
      new NotFoundError(`No discussion found with id: ${discussion.id}`),
    );
  });

  it("updates the discussion when siret matches the one of the convention", async () => {
    const discussion = new DiscussionBuilder()
      .withSiret(convention.siret)
      .build();
    const expectedUpdatedDiscussion: DiscussionDto = {
      ...discussion,
      status: "ACCEPTED",
      conventionId: convention.id,
    };

    uow.discussionRepository.discussions = [discussion];

    await markDiscussionLinkedToConvention.execute({
      convention: convention,
      discussionId: discussion.id,
    });

    expectToEqual(uow.discussionRepository.discussions, [
      expectedUpdatedDiscussion,
    ]);
  });
});
