import {
  AgencyDtoBuilder,
  AssessmentDto,
  ConventionDtoBuilder,
  InclusionConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createAssessmentEntity } from "../../entities/AssessmentEntity";
import { NotifyAgencyThatAssessmentIsCreated } from "./NotifyAgencyThatAssessmentIsCreated";

const agency = new AgencyDtoBuilder().build();
const validator = new InclusionConnectedUserBuilder()
  .withEmail("validator@email.com")
  .withId("validator")
  .buildUser();
const convention = new ConventionDtoBuilder()
  .withAgencyId(agency.id)
  .withStatus("ACCEPTED_BY_VALIDATOR")
  .build();

const assessment: AssessmentDto = {
  endedWithAJob: false,
  conventionId: convention.id,
  status: "COMPLETED",
  establishmentFeedback: "osef",
  establishmentAdvices: "osef",
};

describe("NotifyAgencyThatAssessmentIsCreated", () => {
  let uow: InMemoryUnitOfWork;
  let usecase: NotifyAgencyThatAssessmentIsCreated;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    usecase = new NotifyAgencyThatAssessmentIsCreated(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(
        new UuidV4Generator(),
        new CustomTimeGateway(),
      ),
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  it("Throw when no convention were found", async () => {
    await expectPromiseToFailWithError(
      usecase.execute({ assessment }),
      errors.convention.notFound({ conventionId: assessment.conventionId }),
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Throw when no agency were found", async () => {
    await uow.conventionRepository.save(convention);

    await expectPromiseToFailWithError(
      usecase.execute({ assessment }),
      errors.agency.notFound({ agencyId: convention.agencyId }),
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Send an email to validators ", async () => {
    const validator2 = new InclusionConnectedUserBuilder()
      .withEmail("validator2@email.com")
      .withId("validator2")
      .buildUser();
    uow.userRepository.users = [validator, validator2];
    await uow.agencyRepository.insert(
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        [validator2.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );
    await uow.conventionRepository.save(convention);
    await uow.assessmentRepository.save(
      createAssessmentEntity(assessment, convention),
    );

    await usecase.execute({ assessment });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "NEW_ASSESSMENT_CREATED_AGENCY_NOTIFICATION",
          params: {
            immersionObjective: convention.immersionObjective,
            conventionId: convention.id,
            dateStart: convention.dateStart,
            dateEnd: convention.dateEnd,
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            establishmentFeedback: assessment.establishmentFeedback,
            assessmentStatus: assessment.status,
            internshipKind: convention.internshipKind,
          },
          recipients: [validator.email, validator2.email],
        },
      ],
    });
  });
});
