import {
  ConventionDtoBuilder,
  errors,
  expectPromiseToFailWithError,
  getFormattedFirstnameAndLastname,
} from "shared";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeCreateNewEvent } from "../../../core/events/ports/EventBus";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { makeShortLinkUrl } from "../../../core/short-link/ShortLink";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeNotifyActorsThatAssessmentDeleted,
  type NotifyActorsThatAssessmentDeleted,
} from "./NotifyActorsThatAssessmentDeleted";

describe("NotifyActorsThatAssessmentDeleted", () => {
  let uow: InMemoryUnitOfWork;
  let useCase: NotifyActorsThatAssessmentDeleted;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: CustomTimeGateway;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let config: ReturnType<typeof AppConfigBuilder.prototype.build>;

  const conventionId = "fa3e2221-cac9-43a8-b0a6-a2b0eaeeb4a5";
  const deleteAssessmentJustification = "Assessment was filled incorrectly.";
  const shortLinkId = "shortlink-id-1";

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway(new Date("2024-01-01T12:00:00.000Z"));
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);
    config = new AppConfigBuilder().build();

    const uuidGenerator = new UuidV4Generator();
    const createNewEvent = makeCreateNewEvent({ timeGateway, uuidGenerator });
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
      createNewEvent,
    );

    useCase = makeNotifyActorsThatAssessmentDeleted({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent,
        generateConventionMagicLinkUrl: fakeGenerateMagicLinkUrlFn,
        timeGateway,
        shortLinkIdGeneratorGateway,
        config,
      },
    });
  });

  it("should send emails to tutor and beneficiary when assessment is deleted", async () => {
    const convention = new ConventionDtoBuilder()
      .withId(conventionId)
      .withEstablishmentTutorEmail("tutor@example.com")
      .withBeneficiaryEmail("beneficiary@example.com")
      .build();

    uow.conventionRepository.setConventions([convention]);

    await useCase.execute({
      conventionId,
      deleteAssessmentJustification,
      triggeredBy: {
        kind: "connected-user",
        userId: "22222222-2222-4222-2222-222222222222",
      },
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "ASSESSMENT_DELETED_ESTABLISHMENT_NOTIFICATION",
          params: {
            assessmentCreationLink: makeShortLinkUrl(config, shortLinkId),
            beneficiaryName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
              lastname: convention.signatories.beneficiary.lastName,
            }),
            establishmentTutorName: getFormattedFirstnameAndLastname({
              firstname: convention.establishmentTutor.firstName,
              lastname: convention.establishmentTutor.lastName,
            }),
            justification: deleteAssessmentJustification,
            internshipKind: convention.internshipKind,
          },
          recipients: [convention.establishmentTutor.email],
        },
        {
          kind: "ASSESSMENT_DELETED_BENEFICIARY_NOTIFICATION",
          params: {
            beneficiaryName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
              lastname: convention.signatories.beneficiary.lastName,
            }),
            conventionId: convention.id,
            internshipKind: convention.internshipKind,
          },
          recipients: [convention.signatories.beneficiary.email],
        },
      ],
    });
  });

  it("should throw error if convention does not exist", async () => {
    await expectPromiseToFailWithError(
      useCase.execute({
        conventionId,
        deleteAssessmentJustification,
        triggeredBy: {
          kind: "connected-user",
          userId: "22222222-2222-4222-2222-222222222222",
        },
      }),
      errors.convention.notFound({
        conventionId,
      }),
    );
  });
});
