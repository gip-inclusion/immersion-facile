import { ConventionDtoBuilder, DiscussionBuilder, expectToEqual } from "shared";
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

  it("does nothing if discussion is not found", async () => {
    const discussion = new DiscussionBuilder()
      .withSiret("11110000222200")
      .build();

    await markDiscussionLinkedToConvention.execute({
      convention,
      discussionId: discussion.id,
    });

    expectToEqual(uow.discussionRepository.discussions, []);
  });

  it("does not update the discussion if the siret does not match", async () => {
    const discussion = new DiscussionBuilder()
      .withSiret("11110000222200")
      .build();

    uow.discussionRepository.discussions = [discussion];

    await markDiscussionLinkedToConvention.execute({
      convention,
      discussionId: discussion.id,
    });

    expectToEqual(uow.discussionRepository.discussions, [discussion]);
  });

  it("updates the discussion when siret matches the one of the convention", async () => {
    const discussion = new DiscussionBuilder()
      .withSiret(convention.siret)
      .build();

    uow.discussionRepository.discussions = [discussion];

    await markDiscussionLinkedToConvention.execute({
      convention: convention,
      discussionId: discussion.id,
    });

    expectToEqual(uow.discussionRepository.discussions, [
      { ...discussion, conventionId: convention.id },
    ]);
  });
});
