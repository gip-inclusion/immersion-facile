import {
  ConventionDtoBuilder,
  DiscussionBuilder,
  type DiscussionDto,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type MarkDiscussionLinkedToConvention,
  makeMarkDiscussionLinkedToConvention,
} from "./MarkDiscussionLinkedToConvention";

const convention = new ConventionDtoBuilder().build();

describe("MarkDiscussionLinkedToConvention", () => {
  let markDiscussionLinkedToConvention: MarkDiscussionLinkedToConvention;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    const uowPerformer = new InMemoryUowPerformer(uow);
    markDiscussionLinkedToConvention = makeMarkDiscussionLinkedToConvention({
      uowPerformer,
      deps: { timeGateway },
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
      errors.discussion.notFound({ discussionId: discussion.id }),
    );
  });

  it("updates the discussion when siret matches the one of the convention", async () => {
    const discussion = new DiscussionBuilder()
      .withSiret(convention.siret)
      .build();
    const expectedUpdatedDiscussion: DiscussionDto = {
      ...discussion,
      updatedAt: timeGateway.now().toISOString(),
      status: "ACCEPTED",
      candidateWarnedMethod: null,
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
