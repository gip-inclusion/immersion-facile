import { ImmersionOutcomeDto } from "shared/src/immersionOutcome/ImmersionOutcomeDto";
import {
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectTypeToMatchAndEqual,
  makeTestCreateNewEvent,
} from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryImmersionOutcomeRepository } from "../../../adapters/secondary/InMemoryImmersionOutcomeRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { CreateImmersionOutcome } from "../../../domain/immersionOutcome/useCases/CreateImmersionOutcome";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { MagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";

const applicationId = "conventionId";

const immersionOutcome: ImmersionOutcomeDto = {
  id: "123",
  status: "FINISHED",
  establishmentFeedback: "Ca c'est bien passé",
  conventionId: applicationId,
};

const validPayload = {
  applicationId,
  role: "establishment",
} as MagicLinkPayload;

describe("CreateImmersionOutcome", () => {
  let outboxRepository: InMemoryOutboxRepository;
  let createImmersionOutcome: CreateImmersionOutcome;
  let uowPerformer: InMemoryUowPerformer;
  let immersionOutcomeRepository: InMemoryImmersionOutcomeRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    immersionOutcomeRepository = uow.immersionOutcomeRepository;
    outboxRepository = uow.outboxRepo;
    uowPerformer = new InMemoryUowPerformer(uow);
    const createNewEvent = makeTestCreateNewEvent();
    createImmersionOutcome = new CreateImmersionOutcome(
      uowPerformer,
      createNewEvent,
    );
  });

  it("throws forbidden error if no magicLink payload is provided", async () => {
    await expectPromiseToFailWithError(
      createImmersionOutcome.execute(immersionOutcome),
      new ForbiddenError(),
    );
  });

  it("throws forbidden error if magicLink payload has a different applicationId linked", async () => {
    await expectPromiseToFailWithError(
      createImmersionOutcome.execute(immersionOutcome, {
        applicationId: "otherId",
      } as MagicLinkPayload),
      new ForbiddenError(),
    );
  });

  it("throws forbidden error if magicLink role is not establishment", async () => {
    await expectPromiseToFailWithError(
      createImmersionOutcome.execute(immersionOutcome, {
        applicationId,
        role: "beneficiary",
      } as MagicLinkPayload),
      new ForbiddenError(),
    );
  });

  it("should save the ImmersionOutcome", async () => {
    await createImmersionOutcome.execute(immersionOutcome, validPayload);
    expectTypeToMatchAndEqual(immersionOutcomeRepository.immersionOutcomes, [
      immersionOutcome,
    ]);
  });

  it("should dispatch an ImmersionOutcomeCreated event", async () => {
    await createImmersionOutcome.execute(immersionOutcome, validPayload);
    expect(outboxRepository.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepository.events[0], {
      topic: "ImmersionOutcomeCreated",
      payload: immersionOutcome,
    });
  });
});
