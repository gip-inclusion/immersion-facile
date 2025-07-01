import {
  AssessmentDtoBuilder,
  ConventionDtoBuilder,
  errors,
  expectPromiseToFailWithError,
  frontRoutes,
  getFormattedFirstnameAndLastname,
} from "shared";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeNotifyEstablishmentThatAssessmentWasCreated,
  type NotifyEstablishmentThatAssessmentWasCreated,
} from "./NotifyEstablishmentThatAssessmentWasCreated";

describe("NotifyEstablishmentThatAssessmentWasCreated", () => {
  let notifyEstablishmentThatAssessmentWasCreated: NotifyEstablishmentThatAssessmentWasCreated;
  let uow: InMemoryUnitOfWork;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    timeGateway = new CustomTimeGateway();
    notifyEstablishmentThatAssessmentWasCreated =
      makeNotifyEstablishmentThatAssessmentWasCreated({
        uowPerformer,
        deps: {
          saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
            new UuidV4Generator(),
            new CustomTimeGateway(),
          ),
          generateLink: fakeGenerateMagicLinkUrlFn,
          timeGateway,
        },
      });
  });

  it("throws when conventions is not found", async () => {
    const assessmentWithNoConvention = new AssessmentDtoBuilder()
      .withConventionId("404")
      .build();
    await expectPromiseToFailWithError(
      notifyEstablishmentThatAssessmentWasCreated.execute({
        assessment: assessmentWithNoConvention,
      }),
      errors.convention.notFound({
        conventionId: assessmentWithNoConvention.conventionId,
      }),
    );
  });

  it("sends the notification to establishment representative and to tutor with a magic link for each role", async () => {
    const convention = new ConventionDtoBuilder()
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withEstablishmentRepresentativeEmail(
        "establishment-representative@example.com",
      )
      .withEstablishmentTutorEmail("establishment-tutor@example.com")
      .build();

    const assessment = new AssessmentDtoBuilder()
      .withConventionId(convention.id)
      .build();

    uow.conventionRepository.setConventions([convention]);

    const now = new Date("2025-02-12T08:00:00.000Z");

    timeGateway.setNextDates([now, now]);

    await notifyEstablishmentThatAssessmentWasCreated.execute({ assessment });
    const { establishmentTutor } = convention;
    const { establishmentRepresentative, beneficiary } = convention.signatories;
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "ASSESSMENT_CREATED_ESTABLISHMENT_NOTIFICATION",
          recipients: [establishmentRepresentative.email],
          params: {
            beneficiaryFullName: getFormattedFirstnameAndLastname({
              firstname: beneficiary.firstName,
              lastname: beneficiary.lastName,
            }),
            recipientFullName: getFormattedFirstnameAndLastname({
              firstname: establishmentRepresentative.firstName,
              lastname: establishmentRepresentative.lastName,
            }),
            internshipKind: convention.internshipKind,
            businessName: convention.businessName,
            linkToAssessment: fakeGenerateMagicLinkUrlFn({
              email: convention.signatories.establishmentRepresentative.email,
              role: "establishment-representative",
              targetRoute: frontRoutes.assessmentDocument,
              now,
              id: convention.id,
              lifetime: "long",
            }),
          },
        },
        {
          kind: "ASSESSMENT_CREATED_ESTABLISHMENT_NOTIFICATION",
          recipients: [establishmentTutor.email],
          params: {
            beneficiaryFullName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
              lastname: convention.signatories.beneficiary.lastName,
            }),
            recipientFullName: getFormattedFirstnameAndLastname({
              firstname: establishmentTutor.firstName,
              lastname: establishmentTutor.lastName,
            }),
            internshipKind: convention.internshipKind,
            businessName: convention.businessName,
            linkToAssessment: fakeGenerateMagicLinkUrlFn({
              email: convention.establishmentTutor.email,
              role: "establishment-tutor",
              targetRoute: frontRoutes.assessmentDocument,
              now,
              id: convention.id,
              lifetime: "long",
            }),
          },
        },
      ],
    });
  });

  it("sends the notification to the representative only if the mail is the same for tutor", async () => {
    const establishmentEmail = "establishment@example.com";
    const convention = new ConventionDtoBuilder()
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withEstablishmentRepresentativeEmail(establishmentEmail)
      .withEstablishmentTutorEmail(establishmentEmail)
      .build();

    const assessment = new AssessmentDtoBuilder()
      .withConventionId(convention.id)
      .build();

    uow.conventionRepository.setConventions([convention]);

    const now = new Date("2025-02-12T08:00:00.000Z");

    timeGateway.setNextDate(now);

    await notifyEstablishmentThatAssessmentWasCreated.execute({ assessment });
    const { establishmentRepresentative, beneficiary } = convention.signatories;
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "ASSESSMENT_CREATED_ESTABLISHMENT_NOTIFICATION",
          recipients: [establishmentRepresentative.email],
          params: {
            beneficiaryFullName: getFormattedFirstnameAndLastname({
              firstname: beneficiary.firstName,
              lastname: beneficiary.lastName,
            }),
            recipientFullName: getFormattedFirstnameAndLastname({
              firstname: establishmentRepresentative.firstName,
              lastname: establishmentRepresentative.lastName,
            }),
            internshipKind: convention.internshipKind,
            businessName: convention.businessName,
            linkToAssessment: fakeGenerateMagicLinkUrlFn({
              email: convention.signatories.establishmentRepresentative.email,
              role: "establishment-representative",
              targetRoute: frontRoutes.assessmentDocument,
              now,
              id: convention.id,
              lifetime: "long",
            }),
          },
        },
      ],
    });
  });
});
