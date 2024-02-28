import {
  AgencyDtoBuilder,
  AssessmentDto,
  ConventionDtoBuilder,
  expectPromiseToFailWith,
} from "shared";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationsAndEvents";
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
const convention = new ConventionDtoBuilder()
  .withAgencyId(agency.id)
  .withStatus("ACCEPTED_BY_VALIDATOR")
  .build();

const assessment: AssessmentDto = {
  conventionId: convention.id,
  status: "FINISHED",
  establishmentFeedback: "osef",
};

describe("NotifyAgencyThatAssessmentIsCreated", () => {
  let uow: InMemoryUnitOfWork;
  let uowPerformer: InMemoryUowPerformer;
  let usecase: NotifyAgencyThatAssessmentIsCreated;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
    const timeGateway = new CustomTimeGateway();
    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    usecase = new NotifyAgencyThatAssessmentIsCreated(
      uowPerformer,
      saveNotificationAndRelatedEvent,
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  it("Throw when no convention were found", async () => {
    await expectPromiseToFailWith(
      usecase.execute({ assessment }),
      `Unable to send mail. No convention were found with id : ${assessment.conventionId}`,
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Throw when no agency were found", async () => {
    await uow.conventionRepository.save(convention);

    await expectPromiseToFailWith(
      usecase.execute({ assessment }),
      `Unable to send mail. No agency were found with id : ${convention.agencyId}`,
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Send an email to first validator", async () => {
    await uow.agencyRepository.insert(agency);
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
            agencyValidatorEmail: agency.validatorEmails[0],
            assessmentStatus: assessment.status,
            internshipKind: convention.internshipKind,
          },
          recipients: [agency.validatorEmails[0]],
        },
      ],
    });
  });
});
