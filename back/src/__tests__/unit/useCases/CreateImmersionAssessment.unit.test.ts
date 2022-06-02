import {
  ApplicationStatus,
  validApplicationStatus,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { ImmersionAssessmentDto } from "shared/src/immersionAssessment/ImmersionAssessmentDto";
import { ConventionMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import {
  expectArraysToEqual,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  makeTestCreateNewEvent,
  splitCasesBetweenPassingAndFailing,
} from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { InMemoryImmersionAssessmentRepository } from "../../../adapters/secondary/InMemoryImmersionAssessmentRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { ImmersionAssessmentEntity } from "../../../domain/immersionApplication/entities/ImmersionAssessmentEntity";
import { CreateImmersionAssessment } from "../../../domain/immersionApplication/useCases/CreateImmersionAssessment";

const conventionId = "conventionId";

const immersionAssessment: ImmersionAssessmentDto = {
  conventionId,
  status: "FINISHED",
  establishmentFeedback: "Ca c'est bien passé",
};

const immersionApplicationEntityBuilder =
  new ImmersionApplicationEntityBuilder().withId(conventionId);

const validPayload = {
  applicationId: conventionId,
  role: "establishment",
} as ConventionMagicLinkPayload;

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
    const convention = immersionApplicationEntityBuilder
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
      } as ConventionMagicLinkPayload),
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
      } as ConventionMagicLinkPayload),
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

  it("throws ConflictError if the assessment already exists for the convention", async () => {
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

  const [passingStatuses, failingStatuses] =
    splitCasesBetweenPassingAndFailing<ApplicationStatus>(
      validApplicationStatus,
      ["ACCEPTED_BY_VALIDATOR", "VALIDATED"],
    );

  it.each(failingStatuses.map((status) => ({ status })))(
    "throws bad request if the convention status is $status",
    async ({ status }) => {
      const convention = immersionApplicationEntityBuilder
        .withStatus(status)
        .build();
      immersionApplicationRepository.setImmersionApplications({
        [convention.id]: convention,
      });

      await expectPromiseToFailWithError(
        createImmersionAssessment.execute(immersionAssessment, validPayload),
        new BadRequestError(
          `Cannot create an assessment for which the convention has not been validated, status was ${status}`,
        ),
      );
    },
  );

  it.each(passingStatuses.map((status) => ({ status })))(
    "should save the ImmersionAssessment if convention has status $status",
    async ({ status }) => {
      const convention = immersionApplicationEntityBuilder
        .withStatus(status)
        .build();
      immersionApplicationRepository.setImmersionApplications({
        [convention.id]: convention,
      });

      await createImmersionAssessment.execute(
        immersionAssessment,
        validPayload,
      );

      const expectedImmersionEntity: ImmersionAssessmentEntity = {
        ...immersionAssessment,
        _entityName: "ImmersionAssessment",
      };
      expectArraysToEqual(immersionAssessmentRepository.assessments, [
        expectedImmersionEntity,
      ]);
    },
  );

  it("should dispatch an ImmersionAssessmentCreated event", async () => {
    await createImmersionAssessment.execute(immersionAssessment, validPayload);
    expect(outboxRepository.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepository.events[0], {
      topic: "ImmersionAssessmentCreated",
      payload: immersionAssessment,
    });
  });
});
