import {
  AssessmentDtoBuilder,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import type { AssessmentEntity } from "../entities/AssessmentEntity";
import {
  type DeleteAssessment,
  makeDeleteAssessment,
} from "./DeleteAssessment";

describe("DeleteAssessment", () => {
  const convention = new ConventionDtoBuilder().build();

  const adminUser = new ConnectedUserBuilder()
    .withId("backoffice-user-id")
    .withIsAdmin(true)
    .buildUser();
  const adminConnectedUser = new ConnectedUserBuilder()
    .withId("backoffice-user-id")
    .withIsAdmin(true)
    .build();

  let uow: InMemoryUnitOfWork;
  let deleteAssessment: DeleteAssessment;
  let timeGateway: CustomTimeGateway;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({ timeGateway, uuidGenerator });

    deleteAssessment = makeDeleteAssessment({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        createNewEvent,
      },
    });
    uow.conventionRepository.setConventions([convention]);
  });

  it("deletes existing assessment and emits event", async () => {
    const assessment: AssessmentEntity = {
      ...new AssessmentDtoBuilder().withMinimalInformations().build(),
      conventionId: convention.id,
      numberOfHoursActuallyMade: convention.schedule.totalHours,
      _entityName: "Assessment",
    };
    uow.assessmentRepository.setAssessments([assessment]);

    uow.userRepository.users = [adminUser];

    await deleteAssessment.execute(
      {
        conventionId: convention.id,
        deleteAssessmentJustification: "Parce que…",
      },
      adminConnectedUser,
    );

    expectToEqual(
      await uow.assessmentRepository.getByConventionId(convention.id),
      undefined,
    );

    expectArraysToMatch(uow.outboxRepository.events, [
      {
        topic: "AssessmentDeleted",
        payload: {
          conventionId: convention.id,
          deleteAssessmentJustification: "Parce que…",
          triggeredBy: {
            kind: "connected-user",
            userId: adminUser.id,
          },
        },
      },
    ]);
  });

  it("throws when user is not backoffice admin", async () => {
    const notAdminUser = new ConnectedUserBuilder()
      .withId("not-admin-user-id")
      .withIsAdmin(false)
      .buildUser();
    const notAdminConnectedUser = new ConnectedUserBuilder()
      .withId("not-admin-user-id")
      .withIsAdmin(false)
      .build();
    uow.userRepository.users = [notAdminUser];

    await expectPromiseToFailWithError(
      deleteAssessment.execute(
        {
          conventionId: convention.id,
          deleteAssessmentJustification: "Parce que…",
        },
        notAdminConnectedUser,
      ),
      errors.user.forbidden({ userId: notAdminUser.id }),
    );
  });

  it("throws when assessment does not exist", async () => {
    uow.userRepository.users = [adminUser];

    await expectPromiseToFailWithError(
      deleteAssessment.execute(
        {
          conventionId: convention.id,
          deleteAssessmentJustification: "Parce que…",
        },
        adminConnectedUser,
      ),
      errors.assessment.notFound(convention.id),
    );
  });
});
