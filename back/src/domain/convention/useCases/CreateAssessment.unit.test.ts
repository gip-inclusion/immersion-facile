import {
  AssessmentDto,
  ConventionDtoBuilder,
  ConventionJwtPayload,
  conventionStatuses,
  currentJwtVersions,
  expectArraysToEqual,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryAssessmentRepository } from "../../../adapters/secondary/InMemoryAssessmentRepository";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { AssessmentEntity } from "../entities/AssessmentEntity";
import { CreateAssessment } from "./CreateAssessment";

const conventionId = "conventionId";

const assessment: AssessmentDto = {
  conventionId,
  status: "FINISHED",
  establishmentFeedback: "Ca c'est bien passé",
};

const ConventionDtoBuilderWithId = new ConventionDtoBuilder().withId(
  conventionId,
);

const validPayload: ConventionJwtPayload = {
  applicationId: conventionId,
  role: "establishment-tutor",
  emailHash: "",
  version: currentJwtVersions.convention,
};

describe("CreateAssessment", () => {
  let outboxRepository: InMemoryOutboxRepository;
  let conventionRepository: InMemoryConventionRepository;
  let createAssessment: CreateAssessment;
  let uowPerformer: InMemoryUowPerformer;
  let assessmentRepository: InMemoryAssessmentRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    assessmentRepository = uow.assessmentRepository;
    conventionRepository = uow.conventionRepository;
    outboxRepository = uow.outboxRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    const convention = ConventionDtoBuilderWithId.withStatus(
      "ACCEPTED_BY_VALIDATOR",
    )
      .withId(conventionId)
      .build();
    conventionRepository.setConventions([convention]);
    createAssessment = new CreateAssessment(
      uowPerformer,
      makeCreateNewEvent({
        timeGateway: new CustomTimeGateway(),
        uuidGenerator: new TestUuidGenerator(),
      }),
    );
  });

  it("throws forbidden if no magicLink payload is provided", async () => {
    await expectPromiseToFailWithError(
      createAssessment.execute(assessment),
      new ForbiddenError("No magic link provided"),
    );
  });

  it("throws forbidden if magicLink payload has a different applicationId linked", async () => {
    await expectPromiseToFailWithError(
      createAssessment.execute(assessment, {
        applicationId: "otherId",
        role: "establishment-tutor",
      } as ConventionJwtPayload),
      new ForbiddenError(
        "Convention provided in DTO is not the same as application linked to it",
      ),
    );
  });

  it("throws forbidden if magicLink role is not establishment", async () => {
    await expectPromiseToFailWithError(
      createAssessment.execute(assessment, {
        applicationId: conventionId,
        role: "beneficiary",
      } as ConventionJwtPayload),
      new ForbiddenError(
        "Only an establishment tutor can create an assessment",
      ),
    );
  });

  it("throws not found if provided conventionId does not match any in DB", async () => {
    const notFoundId = "not-found-id";
    await expectPromiseToFailWithError(
      createAssessment.execute(
        { ...assessment, conventionId: notFoundId },
        { ...validPayload, applicationId: notFoundId },
      ),
      new NotFoundError(`Did not found convention with id: ${notFoundId}`),
    );
  });

  it("throws ConflictError if the assessment already exists for the Convention", async () => {
    assessmentRepository.setAssessments([
      { ...assessment, _entityName: "Assessment" },
    ]);
    await expectPromiseToFailWithError(
      createAssessment.execute(assessment, validPayload),
      new ConflictError(
        `Cannot create an assessment as one already exists for convention with id : ${conventionId}`,
      ),
    );
  });

  const [passingStatuses, failingStatuses] = splitCasesBetweenPassingAndFailing(
    conventionStatuses,
    ["ACCEPTED_BY_VALIDATOR"],
  );

  it.each(failingStatuses.map((status) => ({ status })))(
    "throws bad request if the Convention status is $status",
    async ({ status }) => {
      const convention = ConventionDtoBuilderWithId.withStatus(status).build();
      conventionRepository.setConventions([convention]);

      await expectPromiseToFailWithError(
        createAssessment.execute(assessment, validPayload),
        new BadRequestError(
          `Cannot create an assessment for which the convention has not been validated, status was ${status}`,
        ),
      );
    },
  );

  it.each(passingStatuses.map((status) => ({ status })))(
    "should save the Assessment if Convention has status $status",
    async ({ status }) => {
      const convention = ConventionDtoBuilderWithId.withStatus(status).build();
      conventionRepository.setConventions([convention]);
      await createAssessment.execute(assessment, validPayload);

      const expectedImmersionEntity: AssessmentEntity = {
        ...assessment,
        _entityName: "Assessment",
      };
      expectArraysToEqual(assessmentRepository.assessments, [
        expectedImmersionEntity,
      ]);
    },
  );

  it("should dispatch an AssessmentCreated event", async () => {
    await createAssessment.execute(assessment, validPayload);
    expect(outboxRepository.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepository.events[0], {
      topic: "AssessmentCreated",
      payload: { assessment },
    });
  });
});
