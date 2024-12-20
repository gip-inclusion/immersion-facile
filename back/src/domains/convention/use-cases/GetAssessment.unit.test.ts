import {
  AssessmentDto,
  ConventionJwtPayload,
  ForbiddenError,
  currentJwtVersions,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { GetAssessment, makeGetAssessment } from "./GetAssessment";

const conventionId = "11111111-1111-4111-1111-111111111111";
const validPayload: ConventionJwtPayload = {
  applicationId: conventionId,
  role: "establishment-tutor",
  emailHash: "",
  version: currentJwtVersions.convention,
};

describe("GetAssessment", () => {
  let getAssessment: GetAssessment;
  let uowPerformer: InMemoryUowPerformer;
  let uow: UnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
    getAssessment = makeGetAssessment({
      uowPerformer,
    });
  });

  it("throws forbidden if no magicLink payload is provided", async () => {
    await expectPromiseToFailWithError(
      getAssessment.execute({ conventionId }, undefined),
      new ForbiddenError("No magic link provided"),
    );
  });

  it("throws forbidden if magicLink payload has a different applicationId linked", async () => {
    await expectPromiseToFailWithError(
      getAssessment.execute({ conventionId }, {
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
      getAssessment.execute({ conventionId }, {
        applicationId: conventionId,
        role: "beneficiary",
      } as ConventionJwtPayload),
      new ForbiddenError(
        "Only an establishment tutor can create or get an assessment",
      ),
    );
  });

  it("throw not found error when no assessment exist", async () => {
    await expectPromiseToFailWithError(
      getAssessment.execute(
        {
          conventionId,
        },
        validPayload,
      ),
      errors.assessment.notFound(conventionId),
    );
  });

  it("get assessment it exists", async () => {
    const assessment: AssessmentDto = {
      conventionId,
      status: "COMPLETED",
      endedWithAJob: false,
      establishmentAdvices: "my advices",
      establishmentFeedback: "my feedback",
    };
    await uow.assessmentRepository.save({
      _entityName: "Assessment",
      ...assessment,
    });

    const expectedAssessment = await getAssessment.execute(
      {
        conventionId,
      },
      validPayload,
    );

    expect(expectedAssessment).toEqual(assessment);
  });
});
