import { ImmersionOutcomeDto } from "shared/src/immersionOutcome/ImmersionOutcomeDto";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import {
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectTypeToMatchAndEqual,
  makeTestCreateNewEvent,
} from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
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

const immersionApplicationBuilder =
  new ImmersionApplicationEntityBuilder().withId(applicationId);

const validPayload = {
  applicationId,
  role: "establishment",
} as MagicLinkPayload;

describe("CreateImmersionOutcome", () => {
  let outboxRepository: InMemoryOutboxRepository;
  let immersionApplicationRepository: InMemoryImmersionApplicationRepository;
  let createImmersionOutcome: CreateImmersionOutcome;
  let uowPerformer: InMemoryUowPerformer;
  let immersionOutcomeRepository: InMemoryImmersionOutcomeRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    immersionOutcomeRepository = uow.immersionOutcomeRepository;
    immersionApplicationRepository = uow.immersionApplicationRepo;
    outboxRepository = uow.outboxRepo;
    uowPerformer = new InMemoryUowPerformer(uow);
    const convention = immersionApplicationBuilder
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .build();
    immersionApplicationRepository.setImmersionApplications({
      [convention.id]: convention,
    });
    const createNewEvent = makeTestCreateNewEvent();
    createImmersionOutcome = new CreateImmersionOutcome(
      uowPerformer,
      createNewEvent,
    );
  });

  it("throws forbidden if no magicLink payload is provided", async () => {
    await expectPromiseToFailWithError(
      createImmersionOutcome.execute(immersionOutcome),
      new ForbiddenError(),
    );
  });

  it("throws forbidden if magicLink payload has a different applicationId linked", async () => {
    await expectPromiseToFailWithError(
      createImmersionOutcome.execute(immersionOutcome, {
        applicationId: "otherId",
      } as MagicLinkPayload),
      new ForbiddenError(),
    );
  });

  it("throws forbidden if magicLink role is not establishment", async () => {
    await expectPromiseToFailWithError(
      createImmersionOutcome.execute(immersionOutcome, {
        applicationId,
        role: "beneficiary",
      } as MagicLinkPayload),
      new ForbiddenError(),
    );
  });

  it("throws not found if provided conventionId does not match any in DB", async () => {
    const notFoundId = "not-found-id";
    await expectPromiseToFailWithError(
      createImmersionOutcome.execute(
        { ...immersionOutcome, conventionId: notFoundId },
        { ...validPayload, applicationId: notFoundId },
      ),
      new NotFoundError(`Did not found convention with id: ${notFoundId}`),
    );
  });

  it("throws bad request if the convention is not in validated", async () => {
    const convention = immersionApplicationBuilder
      .withStatus("IN_REVIEW")
      .build();
    immersionApplicationRepository.setImmersionApplications({
      [convention.id]: convention,
    });

    await expectPromiseToFailWithError(
      createImmersionOutcome.execute(immersionOutcome, validPayload),
      new BadRequestError(
        "Cannot create an outcome for which the convention has not been validated, status was IN_REVIEW",
      ),
    );
  });

  it("should save the ImmersionOutcome", async () => {
    await createImmersionOutcome.execute(immersionOutcome, validPayload);
    expectTypeToMatchAndEqual(immersionOutcomeRepository.immersionOutcomes, [
      { ...immersionOutcome, _tag: "Entity" },
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
