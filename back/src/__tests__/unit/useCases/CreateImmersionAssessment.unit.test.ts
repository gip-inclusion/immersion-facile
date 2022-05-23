import { ImmersionAssessmentDto } from "shared/src/immersionAssessment/ImmersionAssessmentDto";
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
import { InMemoryImmersionAssessmentRepository } from "../../../adapters/secondary/InMemoryImmersionAssessmentRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { CreateImmersionAssessment } from "../../../domain/immersionAssessment/useCases/CreateImmersionAssessment";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { MagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";

const applicationId = "conventionId";

const immersionAssessment: ImmersionAssessmentDto = {
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

describe("CreateImmersionAssessment", () => {
  let outboxRepository: InMemoryOutboxRepository;
  let immersionApplicationRepository: InMemoryImmersionApplicationRepository;
  let createImmersionAssessment: CreateImmersionAssessment;
  let uowPerformer: InMemoryUowPerformer;
  let immersionAssessmentRepository: InMemoryImmersionAssessmentRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    immersionAssessmentRepository = uow.immersionAssessmentRepository;
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
    createImmersionAssessment = new CreateImmersionAssessment(
      uowPerformer,
      createNewEvent,
    );
  });

  it("throws forbidden if no magicLink payload is provided", async () => {
    await expectPromiseToFailWithError(
      createImmersionAssessment.execute(immersionAssessment),
      new ForbiddenError(),
    );
  });

  it("throws forbidden if magicLink payload has a different applicationId linked", async () => {
    await expectPromiseToFailWithError(
      createImmersionAssessment.execute(immersionAssessment, {
        applicationId: "otherId",
      } as MagicLinkPayload),
      new ForbiddenError(),
    );
  });

  it("throws forbidden if magicLink role is not establishment", async () => {
    await expectPromiseToFailWithError(
      createImmersionAssessment.execute(immersionAssessment, {
        applicationId,
        role: "beneficiary",
      } as MagicLinkPayload),
      new ForbiddenError(),
    );
  });

  it("throws not found if provided conventionId does not match any in DB", async () => {
    const notFoundId = "not-found-id";
    await expectPromiseToFailWithError(
      createImmersionAssessment.execute(
        { ...immersionAssessment, conventionId: notFoundId },
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
      createImmersionAssessment.execute(immersionAssessment, validPayload),
      new BadRequestError(
        "Cannot create an assessment for which the convention has not been validated, status was IN_REVIEW",
      ),
    );
  });

  it("should save the ImmersionAssessment", async () => {
    await createImmersionAssessment.execute(immersionAssessment, validPayload);
    expectTypeToMatchAndEqual(immersionAssessmentRepository.assessments, [
      { ...immersionAssessment, _tag: "Entity" },
    ]);
  });

  it("should dispatch an ImmersionAssessmentCreated event", async () => {
    await createImmersionAssessment.execute(immersionAssessment, validPayload);
    expect(outboxRepository.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepository.events[0], {
      topic: "ImmersionAssessmentCreated",
      payload: immersionAssessment,
    });
  });
});
