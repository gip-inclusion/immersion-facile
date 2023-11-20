import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  expectPromiseToFailWith,
  ImmersionAssessmentDto,
} from "shared";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../_testBuilders/makeExpectSavedNotificationsAndEvents";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { createImmersionAssessmentEntity } from "../../entities/ImmersionAssessmentEntity";
import { NotifyAgencyThatAssessmentIsCreated } from "./NotifyAgencyThatAssessmentIsCreated";

const agency = new AgencyDtoBuilder().build();
const convention = new ConventionDtoBuilder()
  .withAgencyId(agency.id)
  .withStatus("ACCEPTED_BY_VALIDATOR")
  .build();

const immersionAssessment: ImmersionAssessmentDto = {
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
      usecase.execute(immersionAssessment),
      `Unable to send mail. No convention were found with id : ${immersionAssessment.conventionId}`,
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Throw when no agency were found", async () => {
    await uow.conventionRepository.save(convention);

    await expectPromiseToFailWith(
      usecase.execute(immersionAssessment),
      `Unable to send mail. No agency were found with id : ${convention.agencyId}`,
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Send an email to first validator", async () => {
    await uow.agencyRepository.insert(agency);
    await uow.conventionRepository.save(convention);
    await uow.immersionAssessmentRepository.save(
      createImmersionAssessmentEntity(immersionAssessment, convention),
    );

    await usecase.execute(immersionAssessment);

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
            establishmentFeedback: immersionAssessment.establishmentFeedback,
            agencyValidatorEmail: agency.validatorEmails[0],
            assessmentStatus: immersionAssessment.status,
          },
          recipients: [agency.validatorEmails[0]],
        },
      ],
    });
  });
});
