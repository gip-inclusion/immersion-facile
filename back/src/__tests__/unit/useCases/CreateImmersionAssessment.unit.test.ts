import { ImmersionAssessmentDto } from "shared/src/immersionAssessment/ImmersionAssessmentDto";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import {
  expectArraysToEqual,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  makeTestCreateNewEvent,
} from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { InMemoryImmersionAssessmentRepository } from "../../../adapters/secondary/InMemoryImmersionAssessmentRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { CreateImmersionAssessment } from "../../../domain/immersionAssessment/useCases/CreateImmersionAssessment";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { MagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { ImmersionAssessmentEntity } from "../../../domain/immersionAssessment/entities/ImmersionAssessmentEntity";

const conventionId = "conventionId";

const immersionAssessment: ImmersionAssessmentDto = {
  id: "123",
  status: "FINISHED",
  establishmentFeedback: "Ca c'est bien passé",
  conventionId,
};

const immersionApplicationBuilder =
  new ImmersionApplicationEntityBuilder().withId(conventionId);

const validPayload = {
  applicationId: conventionId,
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
      .withId(conventionId)
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
      new ForbiddenError("No magic link provided"),
    );
  });

  it("throws forbidden if magicLink payload has a different applicationId linked", async () => {
    await expectPromiseToFailWithError(
      createImmersionAssessment.execute(immersionAssessment, {
        applicationId: "otherId",
        role: "establishment",
      } as MagicLinkPayload),
      new ForbiddenError(
        "Convention provided in DTO is not the same as application linked to it",
      ),
    );
  });

  it("throws forbidden if magicLink role is not establishment", async () => {
    await expectPromiseToFailWithError(
      createImmersionAssessment.execute(immersionAssessment, {
        applicationId: conventionId,
        role: "beneficiary",
      } as MagicLinkPayload),
      new ForbiddenError("Only an establishment can create an assessment"),
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

  it("throws bad request if the convention status is not Accepted by validator", async () => {
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

  it("if the assessment already exists for the convention", async () => {
    immersionAssessmentRepository.setAssessments([
      { ...immersionAssessment, _entityName: "ImmersionAssessment" },
    ]);
    await expectPromiseToFailWithError(
      createImmersionAssessment.execute(immersionAssessment, validPayload),
      new ConflictError(
        `Cannot create an assessment as one already exists for convention with id : ${conventionId}`,
      ),
    );
  });

  it("should save the ImmersionAssessment", async () => {
    await createImmersionAssessment.execute(immersionAssessment, validPayload);
    const expectedImmersionEntity: ImmersionAssessmentEntity = {
      ...immersionAssessment,
      _entityName: "ImmersionAssessment",
    };

    expectArraysToEqual(immersionAssessmentRepository.assessments, [
      expectedImmersionEntity,
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
