import { addDays, subDays } from "date-fns";
import {
  AgencyDtoBuilder,
  AssessmentDtoBuilder,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  errors,
  expectArraysToMatch,
  expectObjectInArrayToMatch,
  expectToEqual,
  getFormattedFirstnameAndLastname,
  type Notification,
  type TemplatedEmail,
} from "shared";
import { v4 as uuid } from "uuid";
import { AppConfigBuilder } from "../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import {
  makeSaveNotificationAndRelatedEvent,
  type SaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendAssessmentNeededNotifications } from "./SendAssessmentNeededNotifications";

describe("SendAssessmentNeededNotifications", () => {
  let uow: InMemoryUnitOfWork;
  let sendEmailWithAssessmentCreationLink: SendAssessmentNeededNotifications;
  let timeGateway: CustomTimeGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  const config = new AppConfigBuilder().build();
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;

  const now = new Date("2021-05-15T08:00:00.000Z");
  const twoDaysAgo = subDays(now, 2);
  const oneDayAgo = subDays(now, 1);
  const inOneDay = addDays(now, 1);
  const inTwoDays = addDays(now, 2);

  const agency = new AgencyDtoBuilder()
    .withLogoUrl("http://LOGO AGENCY IF URL")
    .build();
  const counsellor = new ConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor@mail.com")
    .build();
  const validator1 = new ConnectedUserBuilder()
    .withId("validator1")
    .withEmail("validator1@mail.com")
    .build();
  const validator2 = new ConnectedUserBuilder()
    .withId("validator2")
    .withEmail("validator2@mail.com")
    .build();

  const conventionValidatedWithAgencyStartedTwoDaysAgo =
    new ConventionDtoBuilder()
      .withAgencyId(agency.id)
      .withDateStart(twoDaysAgo.toISOString())
      .validated()
      .build();

  const conventionEndingYesterday = new ConventionDtoBuilder(
    conventionValidatedWithAgencyStartedTwoDaysAgo,
  )
    .withId(uuid())
    .withDateEnd(oneDayAgo.toISOString())
    .build();

  const conventionEndingTomorrow = new ConventionDtoBuilder(
    conventionValidatedWithAgencyStartedTwoDaysAgo,
  )
    .withId(uuid())
    .withDateEnd(inOneDay.toISOString())
    .build();

  const conventionEndingInTwoDays = new ConventionDtoBuilder(
    conventionValidatedWithAgencyStartedTwoDaysAgo,
  )
    .withId(uuid())
    .withDateEnd(inTwoDays.toISOString())
    .build();

  const agencyNotifications: TemplatedEmail[] = [
    {
      kind: "ASSESSMENT_AGENCY_NOTIFICATION",
      params: {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        agencyLogoUrl: agency.logoUrl!,
        agencyReferentName: getFormattedFirstnameAndLastname(
          conventionEndingTomorrow.agencyReferent ?? {},
        ),
        beneficiaryFirstName: getFormattedFirstnameAndLastname({
          firstname: conventionEndingTomorrow.signatories.beneficiary.firstName,
        }),
        beneficiaryLastName: getFormattedFirstnameAndLastname({
          lastname: conventionEndingTomorrow.signatories.beneficiary.lastName,
        }),
        conventionId: conventionEndingTomorrow.id,
        businessName: conventionEndingTomorrow.businessName,
        assessmentCreationLink: fakeGenerateMagicLinkUrlFn({
          email: validator1.email,
          id: conventionEndingTomorrow.id,
          targetRoute: "bilan-immersion",
          role: "validator",
          now,
        }),
        internshipKind: conventionEndingTomorrow.internshipKind,
      },
      recipients: [validator1.email],
      sender: {
        email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
        name: "Immersion Facilitée",
      },
    },
    {
      kind: "ASSESSMENT_AGENCY_NOTIFICATION",
      params: {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        agencyLogoUrl: agency.logoUrl!,
        agencyReferentName: getFormattedFirstnameAndLastname(
          conventionEndingTomorrow.agencyReferent ?? {},
        ),
        beneficiaryFirstName: getFormattedFirstnameAndLastname({
          firstname: conventionEndingTomorrow.signatories.beneficiary.firstName,
        }),
        beneficiaryLastName: getFormattedFirstnameAndLastname({
          lastname: conventionEndingTomorrow.signatories.beneficiary.lastName,
        }),
        conventionId: conventionEndingTomorrow.id,
        businessName: conventionEndingTomorrow.businessName,
        assessmentCreationLink: fakeGenerateMagicLinkUrlFn({
          email: counsellor.email,
          id: conventionEndingTomorrow.id,
          targetRoute: "bilan-immersion",
          role: "counsellor",
          now,
        }),
        internshipKind: conventionEndingTomorrow.internshipKind,
      },
      recipients: [counsellor.email],
      sender: {
        email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
        name: "Immersion Facilitée",
      },
    },
  ];

  beforeEach(() => {
    const uuidGenerator = new UuidV4Generator();

    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway(now);

    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();

    sendEmailWithAssessmentCreationLink = new SendAssessmentNeededNotifications(
      new InMemoryUowPerformer(uow),
      {
        conventionQueries: uow.conventionQueries,
        assessmentRepository: uow.assessmentRepository,
      },
      saveNotificationAndRelatedEvent,
      timeGateway,
      fakeGenerateMagicLinkUrlFn,
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator,
      }),
      config,
      shortLinkIdGeneratorGateway,
    );

    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [counsellor.id]: { isNotifiedByEmail: true, roles: ["counsellor"] },
        [validator1.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        [validator2.id]: { isNotifiedByEmail: false, roles: ["validator"] },
      }),
    ];
    uow.userRepository.users = [counsellor, validator1, validator2];
    shortLinkIdGeneratorGateway.addMoreShortLinkIds(["short-link-id-1"]);
  });

  describe("Right paths", () => {
    it("Sends an email to tutors and agency validators and counsellors with is_notified_by_email active for immersions that end in time range and are kind immersion", async () => {
      // Arrange
      uow.conventionRepository.setConventions([
        conventionEndingTomorrow,
        conventionEndingInTwoDays,
      ]);

      expectToEqual(
        await sendEmailWithAssessmentCreationLink.execute({
          conventionEndDate: {
            from: now,
            to: inOneDay,
          },
        }),
        {
          conventionsQtyWithImmersionEnding: 1,
          conventionsQtyWithAlreadyExistingAssessment: 0,
          conventionsQtyWithAssessmentSentSuccessfully: 1,
        },
      );

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
            params: {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              agencyLogoUrl: agency.logoUrl!,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionEndingTomorrow.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionEndingTomorrow.signatories.beneficiary.lastName,
              }),
              conventionId: conventionEndingTomorrow.id,
              establishmentTutorName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionEndingTomorrow.establishmentTutor.firstName,
                lastname: conventionEndingTomorrow.establishmentTutor.lastName,
              }),
              assessmentCreationLink: `${config.immersionFacileBaseUrl}/api/to/short-link-id-1`,
              internshipKind: conventionEndingTomorrow.internshipKind,
            },
            recipients: [conventionEndingTomorrow.establishmentTutor.email],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
          ...agencyNotifications,
          {
            kind: "ASSESSMENT_BENEFICIARY_NOTIFICATION",
            params: {
              conventionId: conventionEndingTomorrow.id,
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionEndingTomorrow.signatories.beneficiary.lastName,
              }),
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionEndingTomorrow.signatories.beneficiary.firstName,
              }),
              businessName: conventionEndingTomorrow.businessName,
              internshipKind: conventionEndingTomorrow.internshipKind,
              establishmentTutorEmail:
                conventionEndingTomorrow.establishmentTutor.email,
            },
            recipients: [
              conventionEndingTomorrow.signatories.beneficiary.email,
            ],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
        ],
      });

      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        {
          topic: "NotificationAdded",
        },
        {
          topic: "NotificationAdded",
        },
        {
          topic: "NotificationAdded",
        },
        {
          topic: "NotificationAdded",
        },
        {
          topic: "EmailWithLinkToCreateAssessmentSent",
          payload: { id: conventionEndingTomorrow.id },
        },
        {
          topic: "BeneficiaryAssessmentEmailSent",
          payload: {
            id: conventionEndingTomorrow.id,
          },
        },
      ]);
    });

    it("Sends an email to tutors only for immersions that end in time range and are kind cci-ministage", async () => {
      // Arrange

      const conventionCCIEndingTomorrow = new ConventionDtoBuilder(
        conventionEndingTomorrow,
      )
        .withInternshipKind("mini-stage-cci")
        .build();

      const conventionCCIEndingInTwoDays = new ConventionDtoBuilder(
        conventionEndingInTwoDays,
      )
        .withInternshipKind("mini-stage-cci")
        .build();

      uow.conventionRepository.setConventions([
        conventionCCIEndingTomorrow,
        conventionCCIEndingInTwoDays,
      ]);

      // Act
      expectToEqual(
        await sendEmailWithAssessmentCreationLink.execute({
          conventionEndDate: {
            from: now,
            to: inOneDay,
          },
        }),
        {
          conventionsQtyWithImmersionEnding: 1,
          conventionsQtyWithAlreadyExistingAssessment: 0,
          conventionsQtyWithAssessmentSentSuccessfully: 1,
        },
      );

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
            params: {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              agencyLogoUrl: agency.logoUrl!,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionCCIEndingTomorrow.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionCCIEndingTomorrow.signatories.beneficiary.lastName,
              }),
              conventionId: conventionCCIEndingTomorrow.id,
              establishmentTutorName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionCCIEndingTomorrow.establishmentTutor.lastName,
                firstname:
                  conventionCCIEndingTomorrow.establishmentTutor.firstName,
              }),
              assessmentCreationLink: `${config.immersionFacileBaseUrl}/api/to/short-link-id-1`,
              internshipKind: conventionCCIEndingTomorrow.internshipKind,
            },
            recipients: [conventionCCIEndingTomorrow.establishmentTutor.email],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
          {
            kind: "ASSESSMENT_BENEFICIARY_NOTIFICATION",
            params: {
              conventionId: conventionCCIEndingTomorrow.id,
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionCCIEndingTomorrow.signatories.beneficiary.lastName,
              }),
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionCCIEndingTomorrow.signatories.beneficiary.firstName,
              }),
              businessName: conventionCCIEndingTomorrow.businessName,
              internshipKind: conventionCCIEndingTomorrow.internshipKind,
              establishmentTutorEmail:
                conventionCCIEndingTomorrow.establishmentTutor.email,
            },
            recipients: [
              conventionCCIEndingTomorrow.signatories.beneficiary.email,
            ],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
        ],
      });

      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        {
          topic: "NotificationAdded",
        },

        {
          topic: "NotificationAdded",
        },
        {
          topic: "EmailWithLinkToCreateAssessmentSent",
          payload: { id: conventionEndingTomorrow.id },
        },
        {
          topic: "BeneficiaryAssessmentEmailSent",
          payload: {
            id: conventionEndingTomorrow.id,
          },
        },
      ]);
    });

    it("Sends only establishment notification when beneficiary already received assessment notification", async () => {
      const existingBeneficiaryEmailContent: TemplatedEmail = {
        kind: "ASSESSMENT_BENEFICIARY_NOTIFICATION",
        params: {
          conventionId: conventionEndingTomorrow.id,
          beneficiaryLastName:
            conventionEndingTomorrow.signatories.beneficiary.lastName,
          beneficiaryFirstName:
            conventionEndingTomorrow.signatories.beneficiary.firstName,
          businessName: conventionEndingTomorrow.businessName,
          internshipKind: conventionEndingTomorrow.internshipKind,
          establishmentTutorEmail:
            conventionEndingTomorrow.establishmentTutor.email,
        },
        recipients: [conventionEndingTomorrow.signatories.beneficiary.email],
        sender: {
          email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
          name: "Immersion Facilitée",
        },
      };

      uow.conventionRepository.setConventions([conventionEndingTomorrow]);

      const existingBeneficiaryNotification: Notification = {
        createdAt: new Date().toISOString(),
        followedIds: {
          conventionId: conventionEndingTomorrow.id,
          agencyId: conventionEndingTomorrow.agencyId,
          establishmentSiret: conventionEndingTomorrow.siret,
        },
        id: "existing-beneficiary-notification",
        kind: "email",
        templatedContent: existingBeneficiaryEmailContent,
      };

      uow.notificationRepository.notifications = [
        existingBeneficiaryNotification,
      ];
      await uow.outboxRepository.save({
        id: "existing-notification-added",
        topic: "NotificationAdded",
        payload: {
          id: existingBeneficiaryNotification.id,
          kind: existingBeneficiaryNotification.kind,
        },
        occurredAt: new Date().toISOString(),
        publications: [],
        wasQuarantined: false,
        status: "published",
      });

      await uow.outboxRepository.save({
        id: "existing-beneficiary-assessment-email",
        topic: "BeneficiaryAssessmentEmailSent",
        payload: {
          id: conventionEndingTomorrow.id,
        },
        occurredAt: new Date().toISOString(),
        publications: [],
        wasQuarantined: false,
        status: "published",
      });

      expectToEqual(
        await sendEmailWithAssessmentCreationLink.execute({
          conventionEndDate: {
            from: now,
            to: inOneDay,
          },
        }),
        {
          conventionsQtyWithImmersionEnding: 1,
          conventionsQtyWithAlreadyExistingAssessment: 0,
          conventionsQtyWithAssessmentSentSuccessfully: 1,
        },
      );

      expectSavedNotificationsAndEvents({
        emails: [
          existingBeneficiaryEmailContent,
          {
            kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
            params: {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              agencyLogoUrl: agency.logoUrl!,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionEndingTomorrow.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionEndingTomorrow.signatories.beneficiary.lastName,
              }),
              conventionId: conventionEndingTomorrow.id,
              establishmentTutorName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionEndingTomorrow.establishmentTutor.firstName,
                lastname: conventionEndingTomorrow.establishmentTutor.lastName,
              }),
              assessmentCreationLink: `${config.immersionFacileBaseUrl}/api/to/short-link-id-1`,
              internshipKind: conventionEndingTomorrow.internshipKind,
            },
            recipients: [conventionEndingTomorrow.establishmentTutor.email],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
          ...agencyNotifications,
        ],
      });

      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        {
          topic: "NotificationAdded",
        },
        {
          topic: "BeneficiaryAssessmentEmailSent",
          payload: {
            id: conventionEndingTomorrow.id,
          },
        },
        {
          topic: "NotificationAdded",
        },
        {
          topic: "NotificationAdded",
        },
        {
          topic: "NotificationAdded",
        },
        {
          topic: "EmailWithLinkToCreateAssessmentSent",
          payload: { id: conventionEndingTomorrow.id },
        },
      ]);
    });

    it("Does not send an email to tutor having already received one", async () => {
      const existingTutorTemplatedEmail: TemplatedEmail = {
        kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
        params: {
          internshipKind: "immersion",
          assessmentCreationLink: fakeGenerateMagicLinkUrlFn({
            email: conventionEndingYesterday.establishmentTutor.email,
            id: conventionEndingYesterday.id,
            targetRoute: "bilan-immersion",
            role: "establishment-tutor",
            now,
          }),
          beneficiaryFirstName: getFormattedFirstnameAndLastname({
            firstname:
              conventionEndingYesterday.signatories.beneficiary.firstName,
          }),
          beneficiaryLastName: getFormattedFirstnameAndLastname({
            lastname:
              conventionEndingYesterday.signatories.beneficiary.lastName,
          }),
          conventionId: conventionEndingYesterday.id,
          establishmentTutorName: getFormattedFirstnameAndLastname({
            firstname: conventionEndingYesterday.establishmentTutor.firstName,
            lastname: conventionEndingYesterday.establishmentTutor.lastName,
          }),
          agencyLogoUrl: undefined,
        },
        recipients: [conventionEndingYesterday.establishmentTutor.email],
        sender: {
          email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
          name: "Immersion Facilitée",
        },
      };
      // Arrange

      uow.conventionRepository.setConventions([conventionEndingYesterday]);
      const tutorNotification: Notification = {
        createdAt: new Date().toISOString(),
        followedIds: {
          conventionId: conventionEndingYesterday.id,
          agencyId: conventionEndingYesterday.agencyId,
          establishmentSiret: conventionEndingYesterday.siret,
        },
        id: "first-notification-added-manually",
        kind: "email",
        templatedContent: existingTutorTemplatedEmail,
      };
      uow.notificationRepository.notifications = [tutorNotification];

      await uow.outboxRepository.save({
        id: "existing-notification-added",
        topic: "NotificationAdded",
        payload: {
          id: tutorNotification.id,
          kind: tutorNotification.kind,
        },
        occurredAt: new Date().toISOString(),
        publications: [],
        wasQuarantined: false,
        status: "published",
      });

      await uow.outboxRepository.save({
        id: "existing-beneficiary-assessment-email",
        topic: "EmailWithLinkToCreateAssessmentSent",
        payload: {
          id: conventionEndingYesterday.id,
        },
        occurredAt: new Date().toISOString(),
        publications: [],
        wasQuarantined: false,
        status: "published",
      });

      expectArraysToMatch(uow.outboxRepository.events, [
        {
          topic: "NotificationAdded",
        },
        {
          topic: "EmailWithLinkToCreateAssessmentSent",
          payload: {
            id: conventionEndingYesterday.id,
          },
        },
      ]);

      // Act
      expectToEqual(
        await sendEmailWithAssessmentCreationLink.execute({
          conventionEndDate: {
            from: oneDayAgo,
            to: now,
          },
        }),
        {
          conventionsQtyWithImmersionEnding: 1,
          conventionsQtyWithAlreadyExistingAssessment: 0,
          conventionsQtyWithAssessmentSentSuccessfully: 1,
        },
      );

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [
          existingTutorTemplatedEmail,
          {
            kind: "ASSESSMENT_BENEFICIARY_NOTIFICATION",
            params: {
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionEndingYesterday.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionEndingYesterday.signatories.beneficiary.lastName,
              }),
              businessName: conventionEndingYesterday.businessName,
              establishmentTutorEmail:
                conventionEndingYesterday.establishmentTutor.email,
              conventionId: conventionEndingYesterday.id,
              internshipKind: conventionEndingYesterday.internshipKind,
            },
            recipients: [
              conventionEndingYesterday.signatories.beneficiary.email,
            ],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
        ],
      });
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          topic: "NotificationAdded",
        },
        {
          topic: "EmailWithLinkToCreateAssessmentSent",
          payload: {
            id: conventionEndingYesterday.id,
          },
        },
        {
          topic: "NotificationAdded",
        },
        {
          topic: "BeneficiaryAssessmentEmailSent",
          payload: { id: conventionEndingYesterday.id },
        },
      ]);
    });

    it("Sends an email to the advisor (and not to other agency users) if the convention is FT connected", async () => {
      const advisorEmail = "john.doe@mail.fr";
      uow.conventionRepository.setConventions([
        conventionEndingTomorrow,
        conventionEndingInTwoDays,
      ]);

      uow.conventionFranceTravailAdvisorRepository.setConventionFranceTravailUsersAdvisor(
        [
          {
            _entityName: "ConventionFranceTravailAdvisor",
            peExternalId: "pe-external-id",
            conventionId: conventionEndingTomorrow.id,
            advisor: {
              firstName: "John",
              lastName: "Doe",
              type: "PLACEMENT",
              email: advisorEmail,
            },
          },
        ],
      );

      const useCaseExecution =
        await sendEmailWithAssessmentCreationLink.execute({
          conventionEndDate: {
            from: now,
            to: inOneDay,
          },
        });

      expect(useCaseExecution.conventionsAssessmentSentErrored).toBeUndefined();

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
            params: {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              agencyLogoUrl: agency.logoUrl!,
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionEndingTomorrow.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionEndingTomorrow.signatories.beneficiary.lastName,
              }),
              conventionId: conventionEndingTomorrow.id,
              establishmentTutorName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionEndingTomorrow.establishmentTutor.firstName,
                lastname: conventionEndingTomorrow.establishmentTutor.lastName,
              }),
              assessmentCreationLink: `${config.immersionFacileBaseUrl}/api/to/short-link-id-1`,
              internshipKind: conventionEndingTomorrow.internshipKind,
            },
            recipients: [conventionEndingTomorrow.establishmentTutor.email],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
          {
            kind: "ASSESSMENT_AGENCY_NOTIFICATION",
            params: {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              agencyLogoUrl: agency.logoUrl!,
              agencyReferentName: getFormattedFirstnameAndLastname(
                conventionEndingTomorrow.agencyReferent ?? {},
              ),
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionEndingTomorrow.signatories.beneficiary.firstName,
              }),
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionEndingTomorrow.signatories.beneficiary.lastName,
              }),
              conventionId: conventionEndingTomorrow.id,
              businessName: conventionEndingTomorrow.businessName,
              assessmentCreationLink: fakeGenerateMagicLinkUrlFn({
                email: advisorEmail,
                id: conventionEndingTomorrow.id,
                targetRoute: "bilan-immersion",
                role: "validator",
                now,
              }),
              internshipKind: conventionEndingTomorrow.internshipKind,
            },
            recipients: [advisorEmail],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
          {
            kind: "ASSESSMENT_BENEFICIARY_NOTIFICATION",
            params: {
              conventionId: conventionEndingTomorrow.id,
              beneficiaryLastName: getFormattedFirstnameAndLastname({
                lastname:
                  conventionEndingTomorrow.signatories.beneficiary.lastName,
              }),
              beneficiaryFirstName: getFormattedFirstnameAndLastname({
                firstname:
                  conventionEndingTomorrow.signatories.beneficiary.firstName,
              }),
              businessName: conventionEndingTomorrow.businessName,
              internshipKind: conventionEndingTomorrow.internshipKind,
              establishmentTutorEmail:
                conventionEndingTomorrow.establishmentTutor.email,
            },
            recipients: [
              conventionEndingTomorrow.signatories.beneficiary.email,
            ],
            sender: {
              email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
              name: "Immersion Facilitée",
            },
          },
        ],
      });
    });

    describe("When an assessment as already been filled", () => {
      it("Does not send emails if the convention already has an assessment filled", async () => {
        uow.conventionRepository.setConventions([conventionEndingYesterday]);
        const assessmentDto = new AssessmentDtoBuilder()
          .withConventionId(conventionEndingYesterday.id)
          .build();
        uow.assessmentRepository.setAssessments([
          {
            _entityName: "Assessment",
            numberOfHoursActuallyMade: 10,
            ...assessmentDto,
          },
        ]);

        expectToEqual(uow.outboxRepository.events, []);

        expectToEqual(
          await sendEmailWithAssessmentCreationLink.execute({
            conventionEndDate: {
              from: oneDayAgo,
              to: now,
            },
          }),
          {
            conventionsQtyWithImmersionEnding: 1,
            conventionsQtyWithAlreadyExistingAssessment: 1,
            conventionsQtyWithAssessmentSentSuccessfully: 0,
          },
        );

        expectToEqual(uow.notificationRepository.notifications, []);
        expectToEqual(uow.outboxRepository.events, []);
      });

      it("Only sends the conventions were no assessment was filled when there are several conventions", async () => {
        const conventionEndingYesterdayWithoutAssessment =
          new ConventionDtoBuilder({ ...conventionEndingYesterday })
            .withId("aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa00")
            .build();
        uow.conventionRepository.setConventions([
          conventionEndingYesterday,
          conventionEndingYesterdayWithoutAssessment,
        ]);

        const assessmentDto = new AssessmentDtoBuilder()
          .withConventionId(conventionEndingYesterday.id)
          .build();

        uow.assessmentRepository.setAssessments([
          {
            _entityName: "Assessment",
            numberOfHoursActuallyMade: 10,
            ...assessmentDto,
          },
        ]);

        expectToEqual(uow.outboxRepository.events, []);

        expectToEqual(
          await sendEmailWithAssessmentCreationLink.execute({
            conventionEndDate: {
              from: oneDayAgo,
              to: now,
            },
          }),
          {
            conventionsQtyWithImmersionEnding: 2,
            conventionsQtyWithAlreadyExistingAssessment: 1,
            conventionsQtyWithAssessmentSentSuccessfully: 1,
          },
        );

        expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
          {
            kind: "email",
            followedIds: {
              conventionId: conventionEndingYesterdayWithoutAssessment.id,
              agencyId: conventionEndingYesterdayWithoutAssessment.agencyId,
            },
            templatedContent: {
              kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
              recipients: expect.any(Array),
              params: expect.any(Object),
            },
          },
          {
            kind: "email",
            followedIds: {
              conventionId: conventionEndingYesterdayWithoutAssessment.id,
              agencyId: conventionEndingYesterdayWithoutAssessment.agencyId,
            },
            templatedContent: {
              kind: "ASSESSMENT_AGENCY_NOTIFICATION",
              recipients: [validator1.email],
              params: expect.any(Object),
            },
          },
          {
            kind: "email",
            followedIds: {
              conventionId: conventionEndingYesterdayWithoutAssessment.id,
              agencyId: conventionEndingYesterdayWithoutAssessment.agencyId,
            },
            templatedContent: {
              kind: "ASSESSMENT_AGENCY_NOTIFICATION",
              recipients: [counsellor.email],
              params: expect.any(Object),
            },
          },
          {
            kind: "email",
            followedIds: {
              conventionId: conventionEndingYesterdayWithoutAssessment.id,
              agencyId: conventionEndingYesterdayWithoutAssessment.agencyId,
            },
            templatedContent: {
              kind: "ASSESSMENT_BENEFICIARY_NOTIFICATION",
              recipients: expect.any(Array),
              params: expect.any(Object),
            },
          },
        ]);
      });
    });
  });

  describe("Error handling report", () => {
    it("shows error in report about convention on missing user but does not fail the entire script", async () => {
      // Arrange

      uow.conventionRepository.setConventions([
        conventionEndingTomorrow,
        conventionEndingInTwoDays,
      ]);
      uow.userRepository.users = [];

      // Act
      expectToEqual(
        await sendEmailWithAssessmentCreationLink.execute({
          conventionEndDate: {
            from: now,
            to: inOneDay,
          },
        }),
        {
          conventionsQtyWithAlreadyExistingAssessment: 0,
          conventionsQtyWithAssessmentSentSuccessfully: 0,
          conventionsQtyWithImmersionEnding: 1,
          conventionsAssessmentSentErrored: {
            [conventionEndingTomorrow.id]: errors.users.notFound({
              userIds: [counsellor.id],
            }),
          },
        },
      );
    });

    it("shows error in report about convention on missing agency but does not fail the entire script", async () => {
      // Arrange

      uow.conventionRepository.setConventions([
        conventionEndingTomorrow,
        conventionEndingInTwoDays,
      ]);
      uow.agencyRepository.agencies = [];

      // Act
      expectToEqual(
        await sendEmailWithAssessmentCreationLink.execute({
          conventionEndDate: {
            from: now,
            to: inOneDay,
          },
        }),
        {
          conventionsQtyWithAlreadyExistingAssessment: 0,
          conventionsQtyWithAssessmentSentSuccessfully: 0,
          conventionsQtyWithImmersionEnding: 1,
          conventionsAssessmentSentErrored: {
            [conventionEndingTomorrow.id]: errors.agency.notFound({
              agencyId: conventionEndingTomorrow.agencyId,
            }),
          },
        },
      );
    });
  });
});
