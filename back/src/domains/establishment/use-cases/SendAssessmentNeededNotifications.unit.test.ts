import { addDays } from "date-fns";
import subDays from "date-fns/subDays";
import {
  AgencyDtoBuilder,
  AssessmentDtoBuilder,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  errors,
  expectObjectInArrayToMatch,
  expectToEqual,
  getFormattedFirstnameAndLastname,
  type Notification,
  type TemplatedEmail,
} from "shared";
import { AppConfigBuilder } from "../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import type { DomainEvent } from "../../core/events/events";
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
    .withId("immersion-ending-yesterday-id")
    .withDateEnd(oneDayAgo.toISOString())
    .build();

  const conventionEndingTomorrow = new ConventionDtoBuilder(
    conventionValidatedWithAgencyStartedTwoDaysAgo,
  )
    .withId("convention-ending-tomorrow")
    .withDateEnd(inOneDay.toISOString())
    .build();

  const conventionEndingInTwoDays = new ConventionDtoBuilder(
    conventionValidatedWithAgencyStartedTwoDaysAgo,
  )
    .withId("convention-ending-in-two-days")
    .withDateEnd(inTwoDays.toISOString())
    .build();

  const conventionEndingTomorrowValidatedEmailContent: TemplatedEmail = {
    kind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
    recipients: [conventionEndingTomorrow.signatories.beneficiary.email],
    sender: {
      email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
      name: "Immersion Facilitée",
    },
    params: {
      agencyLogoUrl: agency.logoUrl ?? undefined,
      beneficiaryBirthdate:
        conventionEndingTomorrow.signatories.beneficiary.birthdate,
      beneficiaryFirstName: getFormattedFirstnameAndLastname({
        firstname: conventionEndingTomorrow.signatories.beneficiary.firstName,
      }),
      beneficiaryLastName: getFormattedFirstnameAndLastname({
        lastname: conventionEndingTomorrow.signatories.beneficiary.lastName,
      }),
      businessName: conventionEndingTomorrow.businessName,
      conventionId: conventionEndingTomorrow.id,
      dateStart: conventionEndingTomorrow.dateStart,
      dateEnd: conventionEndingTomorrow.dateEnd,
      immersionAppellationLabel:
        conventionEndingTomorrow.immersionAppellation.appellationLabel,
      emergencyContactInfos: "",
      establishmentTutorName: getFormattedFirstnameAndLastname({
        firstname: conventionEndingTomorrow.establishmentTutor.firstName,
        lastname: conventionEndingTomorrow.establishmentTutor.lastName,
      }),
      internshipKind: conventionEndingTomorrow.internshipKind,
      validatorName: getFormattedFirstnameAndLastname({
        firstname: validator1.firstName,
        lastname: validator1.lastName,
      }),
      magicLink: fakeGenerateMagicLinkUrlFn({
        email: validator1.email,
        id: conventionEndingTomorrow.id,
        targetRoute: "bilan-immersion",
        role: "validator",
        now,
      }),
      assessmentMagicLink: fakeGenerateMagicLinkUrlFn({
        email: validator1.email,
        id: conventionEndingTomorrow.id,
        targetRoute: "bilan-immersion",
        role: "validator",
        now,
      }),
    },
  };
  const conventionEndingTomorrowValidationNotification: Notification = {
    id: "convention-ending-tomorrow-validated-notification",
    createdAt: new Date().toISOString(),
    kind: "email",
    templatedContent: conventionEndingTomorrowValidatedEmailContent,
    followedIds: {
      conventionId: conventionEndingTomorrow.id,
      agencyId: conventionEndingTomorrow.agencyId,
      establishmentSiret: conventionEndingTomorrow.siret,
    },
  };
  const conventionEndingTomorrowValidationEvent: DomainEvent = {
    id: "convention-ending-tomorrow-validated-notification-event",
    topic: "NotificationAdded",
    payload: {
      id: conventionEndingTomorrowValidationNotification.id,
      kind: conventionEndingTomorrowValidationNotification.kind,
    },
    occurredAt: new Date().toISOString(),
    publications: [],
    wasQuarantined: false,
    status: "published",
  };
  const conventionEndingYesterdayValidatedEmailContent: TemplatedEmail = {
    kind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
    recipients: [conventionEndingYesterday.signatories.beneficiary.email],
    sender: {
      email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
      name: "Immersion Facilitée",
    },
    params: {
      agencyLogoUrl: agency.logoUrl ?? undefined,
      beneficiaryBirthdate:
        conventionEndingYesterday.signatories.beneficiary.birthdate,
      beneficiaryFirstName: getFormattedFirstnameAndLastname({
        firstname: conventionEndingYesterday.signatories.beneficiary.firstName,
      }),
      beneficiaryLastName: getFormattedFirstnameAndLastname({
        lastname: conventionEndingYesterday.signatories.beneficiary.lastName,
      }),
      businessName: conventionEndingYesterday.businessName,
      conventionId: conventionEndingYesterday.id,
      dateStart: conventionEndingYesterday.dateStart,
      dateEnd: conventionEndingYesterday.dateEnd,
      immersionAppellationLabel:
        conventionEndingYesterday.immersionAppellation.appellationLabel,
      emergencyContactInfos: "",
      establishmentTutorName: getFormattedFirstnameAndLastname({
        firstname: conventionEndingYesterday.establishmentTutor.firstName,
        lastname: conventionEndingYesterday.establishmentTutor.lastName,
      }),
      internshipKind: conventionEndingYesterday.internshipKind,
      validatorName: getFormattedFirstnameAndLastname({
        firstname: validator1.firstName,
        lastname: validator1.lastName,
      }),
      magicLink: fakeGenerateMagicLinkUrlFn({
        email: validator1.email,
        id: conventionEndingYesterday.id,
        targetRoute: "bilan-immersion",
        role: "validator",
        now,
      }),
      assessmentMagicLink: fakeGenerateMagicLinkUrlFn({
        email: validator1.email,
        id: conventionEndingYesterday.id,
        targetRoute: "bilan-immersion",
        role: "validator",
        now,
      }),
    },
  };
  const conventionEndingYesterdayValidationNotification: Notification = {
    id: "convention-ending-yesterday-validated-notification",
    createdAt: new Date().toISOString(),
    kind: "email",
    templatedContent: conventionEndingYesterdayValidatedEmailContent,
    followedIds: {
      conventionId: conventionEndingYesterday.id,
      agencyId: conventionEndingYesterday.agencyId,
      establishmentSiret: conventionEndingYesterday.siret,
    },
  };
  const conventionEndingYesterdayValidationEvent: DomainEvent = {
    id: "convention-ending-yesterday-validated-notification-event",
    topic: "NotificationAdded",
    payload: {
      id: conventionEndingYesterdayValidationNotification.id,
      kind: conventionEndingYesterdayValidationNotification.kind,
    },
    occurredAt: new Date().toISOString(),
    publications: [],
    wasQuarantined: false,
    status: "published",
  };

  const agencyEmailContents: TemplatedEmail[] = [
    {
      kind: "ASSESSMENT_AGENCY_NOTIFICATION",
      params: {
        agencyLogoUrl: agency.logoUrl ?? undefined,
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
        conventionRepository: uow.conventionRepository,
        assessmentRepository: uow.assessmentRepository,
        notificationRepository: uow.notificationRepository,
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
      uow.notificationRepository.notifications = [
        conventionEndingTomorrowValidationNotification,
      ];
      uow.conventionRepository.setConventions([
        conventionEndingTomorrow,
        conventionEndingInTwoDays,
      ]);
      await uow.outboxRepository.save(conventionEndingTomorrowValidationEvent);

      const useCaseExecution =
        await sendEmailWithAssessmentCreationLink.execute({
          conventionEndDate: {
            from: now,
            to: inOneDay,
          },
        });

      expect(useCaseExecution.errors).toEqual({});

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [
          conventionEndingTomorrowValidatedEmailContent,
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
          ...agencyEmailContents,
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
          topic: "NotificationAdded",
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
      uow.notificationRepository.notifications = [
        conventionEndingTomorrowValidationNotification,
      ];
      await uow.outboxRepository.save(conventionEndingTomorrowValidationEvent);

      // Act
      await sendEmailWithAssessmentCreationLink.execute({
        conventionEndDate: {
          from: now,
          to: inOneDay,
        },
      });

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [
          conventionEndingTomorrowValidatedEmailContent,
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
          topic: "NotificationAdded",
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
      const beneficiaryEmailContent: TemplatedEmail = {
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
      const existingBeneficiaryNotification: Notification = {
        createdAt: new Date().toISOString(),
        followedIds: {
          conventionId: conventionEndingTomorrow.id,
          agencyId: conventionEndingTomorrow.agencyId,
          establishmentSiret: conventionEndingTomorrow.siret,
        },
        id: "existing-beneficiary-notification",
        kind: "email",
        templatedContent: beneficiaryEmailContent,
      };

      uow.conventionRepository.setConventions([conventionEndingTomorrow]);
      uow.notificationRepository.notifications = [
        conventionEndingTomorrowValidationNotification,
        existingBeneficiaryNotification,
      ];
      await uow.outboxRepository.save(conventionEndingTomorrowValidationEvent);
      await uow.outboxRepository.save({
        id: "existing-beneficiary-notification-added",
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

      await sendEmailWithAssessmentCreationLink.execute({
        conventionEndDate: {
          from: now,
          to: inOneDay,
        },
      });

      expectSavedNotificationsAndEvents({
        emails: [
          conventionEndingTomorrowValidatedEmailContent,
          beneficiaryEmailContent,
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
          ...agencyEmailContents,
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

    it("Does not send emails if email VALIDATED_CONVENTION_FINAL_CONFIRMATION has not been sent", async () => {
      uow.notificationRepository.notifications = [];
      uow.conventionRepository.setConventions([conventionEndingYesterday]);

      expectToEqual(uow.outboxRepository.events, []);

      await sendEmailWithAssessmentCreationLink.execute({
        conventionEndDate: {
          from: oneDayAgo,
          to: now,
        },
      });

      expectToEqual(uow.notificationRepository.notifications, []);
      expectToEqual(uow.outboxRepository.events, []);
    });

    it("Does not send an email to immersions having already received one", async () => {
      // Arrange
      uow.notificationRepository.notifications = [
        conventionEndingYesterdayValidationNotification,
      ];
      await uow.outboxRepository.save(conventionEndingYesterdayValidationEvent);
      uow.conventionRepository.setConventions([
        conventionEndingTomorrow,
        conventionEndingInTwoDays,
      ]);
      const existingEstablishmentNotification: Notification = {
        createdAt: new Date().toISOString(),
        followedIds: {
          conventionId: conventionEndingYesterday.id,
          agencyId: conventionEndingYesterday.agencyId,
          establishmentSiret: conventionEndingYesterday.siret,
        },
        id: "first-notification-added-manually",
        kind: "email",
        templatedContent: {
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
        },
      };
      const existingEstablishmentEvent: DomainEvent = {
        id: "existing-establishment-assessment-notification-added",
        topic: "NotificationAdded",
        payload: {
          id: existingEstablishmentNotification.id,
          kind: existingEstablishmentNotification.kind,
        },
        occurredAt: new Date().toISOString(),
        publications: [],
        wasQuarantined: false,
        status: "published",
      };

      uow.conventionRepository.setConventions([conventionEndingYesterday]);
      uow.notificationRepository.notifications = [
        conventionEndingYesterdayValidationNotification,
        existingEstablishmentNotification,
      ];
      await uow.outboxRepository.save(existingEstablishmentEvent);

      expectToEqual(uow.outboxRepository.events, [
        conventionEndingYesterdayValidationEvent,
        existingEstablishmentEvent,
      ]);

      // Act
      await sendEmailWithAssessmentCreationLink.execute({
        conventionEndDate: {
          from: oneDayAgo,
          to: now,
        },
      });

      // Assert
      expectToEqual(uow.notificationRepository.notifications, [
        conventionEndingYesterdayValidationNotification,
        existingEstablishmentNotification,
      ]);
      expectToEqual(uow.outboxRepository.events, [
        conventionEndingYesterdayValidationEvent,
        existingEstablishmentEvent,
      ]);
    });

    describe("When an assessment has already been filled", () => {
      it("Does not send emails if the convention already has an assessment filled", async () => {
        uow.notificationRepository.notifications = [
          conventionEndingYesterdayValidationNotification,
        ];
        await uow.outboxRepository.save(
          conventionEndingYesterdayValidationEvent,
        );
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

        expectToEqual(uow.outboxRepository.events, [
          conventionEndingYesterdayValidationEvent,
        ]);

        await sendEmailWithAssessmentCreationLink.execute({
          conventionEndDate: {
            from: oneDayAgo,
            to: now,
          },
        });

        expectToEqual(uow.notificationRepository.notifications, [
          conventionEndingYesterdayValidationNotification,
        ]);
        expectToEqual(uow.outboxRepository.events, [
          conventionEndingYesterdayValidationEvent,
        ]);
      });

      it("Only sends the conventions where no assessment was filled when there are several conventions", async () => {
        const conventionEndingYesterdayWithoutAssessment =
          new ConventionDtoBuilder({ ...conventionEndingYesterday })
            .withId("aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa00")
            .build();
        const conventionEndingYesterdayWithoutAssessmentNotification = {
          ...conventionEndingYesterdayValidationNotification,
          id: "convention-ending-yesterday-without-assessment-validated-notification",
          followedIds: {
            conventionId: conventionEndingYesterdayWithoutAssessment.id,
            agencyId: conventionEndingYesterdayWithoutAssessment.agencyId,
          },
        };
        const conventionEndingYesterdayWithoutAssessmentValidationEvent: DomainEvent =
          {
            id: "convention-ending-yesterday-without-assessment-validated-notification-event",
            topic: "NotificationAdded",
            payload: {
              id: conventionEndingYesterdayWithoutAssessmentNotification.id,
              kind: conventionEndingYesterdayWithoutAssessmentNotification.kind,
            },
            occurredAt: new Date().toISOString(),
            publications: [],
            wasQuarantined: false,
            status: "published",
          };

        uow.conventionRepository.setConventions([
          conventionEndingYesterday,
          conventionEndingYesterdayWithoutAssessment,
        ]);
        uow.notificationRepository.notifications = [
          conventionEndingYesterdayValidationNotification,
          conventionEndingYesterdayWithoutAssessmentNotification,
        ];
        await uow.outboxRepository.save(
          conventionEndingYesterdayValidationEvent,
        );
        await uow.outboxRepository.save(
          conventionEndingYesterdayWithoutAssessmentValidationEvent,
        );

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

        expectToEqual(uow.outboxRepository.events, [
          conventionEndingYesterdayValidationEvent,
          conventionEndingYesterdayWithoutAssessmentValidationEvent,
        ]);

        const { errors } = await sendEmailWithAssessmentCreationLink.execute({
          conventionEndDate: {
            from: oneDayAgo,
            to: now,
          },
        });

        expect(errors).toEqual({});

        expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
          conventionEndingYesterdayValidationNotification,
          conventionEndingYesterdayWithoutAssessmentNotification,
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

  describe("Wrong paths", () => {
    it("throws on missing user", async () => {
      const conventionEndingInTwoDaysValidationNotification = {
        ...conventionEndingTomorrowValidationNotification,
        id: "convention-ending-in-two-days-validated-notification",
        followedIds: {
          conventionId: conventionEndingInTwoDays.id,
          agencyId: conventionEndingInTwoDays.agencyId,
        },
      };
      uow.notificationRepository.notifications = [
        conventionEndingTomorrowValidationNotification,
        conventionEndingInTwoDaysValidationNotification,
      ];
      uow.conventionRepository.setConventions([
        conventionEndingTomorrow,
        conventionEndingInTwoDays,
      ]);
      uow.userRepository.users = [];
      uow.notificationRepository.notifications = [
        conventionEndingTomorrowValidationNotification,
        conventionEndingInTwoDaysValidationNotification,
        conventionEndingYesterdayValidationNotification,
      ];

      const report = await sendEmailWithAssessmentCreationLink.execute({
        conventionEndDate: {
          from: now,
          to: inOneDay,
        },
      });

      expectToEqual(report, {
        numberOfConventionsWithAlreadyExistingAssessment: 0,
        numberOfImmersionEndingTomorrow: 1,
        errors: {
          [conventionEndingTomorrow.id]: errors.users.notFound({
            userIds: [counsellor.id],
          }),
        },
      });
    });

    it("throws on missing agency", async () => {
      const conventionEndingInTwoDaysNotification = {
        ...conventionEndingTomorrowValidationNotification,
        id: "convention-ending-in-two-days-validated-notification",
        followedIds: {
          conventionId: conventionEndingInTwoDays.id,
          agencyId: conventionEndingInTwoDays.agencyId,
        },
      };
      uow.conventionRepository.setConventions([
        conventionEndingTomorrow,
        conventionEndingInTwoDays,
      ]);
      uow.agencyRepository.agencies = [];
      uow.notificationRepository.notifications = [
        conventionEndingTomorrowValidationNotification,
        conventionEndingInTwoDaysNotification,
      ];

      const report = await sendEmailWithAssessmentCreationLink.execute({
        conventionEndDate: {
          from: now,
          to: inOneDay,
        },
      });

      expectToEqual(report, {
        numberOfConventionsWithAlreadyExistingAssessment: 0,
        numberOfImmersionEndingTomorrow: 1,
        errors: {
          [conventionEndingTomorrow.id]: errors.agency.notFound({
            agencyId: agency.id,
          }),
        },
      });
    });
  });
});
