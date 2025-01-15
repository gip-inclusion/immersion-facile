import { addDays } from "date-fns";
import subDays from "date-fns/subDays";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  InclusionConnectedUserBuilder,
  Notification,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import {
  SaveNotificationAndRelatedEvent,
  makeSaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendEmailsWithAssessmentCreationLink } from "./SendEmailsWithAssessmentCreationLink";

describe("SendEmailWithAssessmentCreationLink", () => {
  let uow: InMemoryUnitOfWork;
  let sendEmailWithAssessmentCreationLink: SendEmailsWithAssessmentCreationLink;
  let timeGateway: CustomTimeGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  const now = new Date("2021-05-15T08:00:00.000Z");
  const twoDaysAgo = subDays(now, 2);
  const oneDayAgo = subDays(now, 1);
  const inOneDay = addDays(now, 1);
  const inTwoDays = addDays(now, 2);

  const agency = new AgencyDtoBuilder()
    .withLogoUrl("http://LOGO AGENCY IF URL")
    .build();
  const counsellor = new InclusionConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor@mail.com")
    .build();
  const validator1 = new InclusionConnectedUserBuilder()
    .withId("validator1")
    .withEmail("validator1@mail.com")
    .build();
  const validator2 = new InclusionConnectedUserBuilder()
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
    sendEmailWithAssessmentCreationLink =
      new SendEmailsWithAssessmentCreationLink(
        new InMemoryUowPerformer(uow),
        saveNotificationAndRelatedEvent,
        timeGateway,
        fakeGenerateMagicLinkUrlFn,
        makeCreateNewEvent({
          timeGateway,
          uuidGenerator,
        }),
      );

    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [counsellor.id]: { isNotifiedByEmail: true, roles: ["counsellor"] },
        [validator1.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        [validator2.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    ];
    uow.userRepository.users = [counsellor, validator1, validator2];
  });

  describe("Right paths", () => {
    it("Sends an email to tutors and agency validators for immersions that end in time range and are kind immersion", async () => {
      // Arrange

      uow.conventionRepository.setConventions([
        conventionEndingTomorrow,
        conventionEndingInTwoDays,
      ]);

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
          {
            kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
            params: {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              agencyLogoUrl: agency.logoUrl!,
              beneficiaryFirstName:
                conventionEndingTomorrow.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionEndingTomorrow.signatories.beneficiary.lastName,
              conventionId: conventionEndingTomorrow.id,
              establishmentTutorName: `${conventionEndingTomorrow.establishmentTutor.firstName} ${conventionEndingTomorrow.establishmentTutor.lastName}`,
              assessmentCreationLink: fakeGenerateMagicLinkUrlFn({
                email: conventionEndingTomorrow.establishmentTutor.email,
                id: conventionEndingTomorrow.id,
                targetRoute: "bilan-immersion",
                role: "establishment-tutor",
                now,
              }),
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
              beneficiaryFirstName:
                conventionEndingTomorrow.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionEndingTomorrow.signatories.beneficiary.lastName,
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
              beneficiaryFirstName:
                conventionEndingTomorrow.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionEndingTomorrow.signatories.beneficiary.lastName,
              conventionId: conventionEndingTomorrow.id,
              businessName: conventionEndingTomorrow.businessName,
              assessmentCreationLink: fakeGenerateMagicLinkUrlFn({
                email: validator2.email,
                id: conventionEndingTomorrow.id,
                targetRoute: "bilan-immersion",
                role: "validator",
                now,
              }),
              internshipKind: conventionEndingTomorrow.internshipKind,
            },
            recipients: [validator2.email],
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
              beneficiaryFirstName:
                conventionEndingTomorrow.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionEndingTomorrow.signatories.beneficiary.lastName,
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
      await sendEmailWithAssessmentCreationLink.execute({
        conventionEndDate: {
          from: now,
          to: inOneDay,
        },
      });

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
            params: {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              agencyLogoUrl: agency.logoUrl!,
              beneficiaryFirstName:
                conventionCCIEndingTomorrow.signatories.beneficiary.firstName,
              beneficiaryLastName:
                conventionCCIEndingTomorrow.signatories.beneficiary.lastName,
              conventionId: conventionCCIEndingTomorrow.id,
              establishmentTutorName: `${conventionCCIEndingTomorrow.establishmentTutor.firstName} ${conventionCCIEndingTomorrow.establishmentTutor.lastName}`,
              assessmentCreationLink: fakeGenerateMagicLinkUrlFn({
                email: conventionCCIEndingTomorrow.establishmentTutor.email,
                id: conventionCCIEndingTomorrow.id,
                targetRoute: "bilan-immersion",
                role: "establishment-tutor",
                now,
              }),
              internshipKind: conventionCCIEndingTomorrow.internshipKind,
            },
            recipients: [conventionCCIEndingTomorrow.establishmentTutor.email],
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
          topic: "EmailWithLinkToCreateAssessmentSent",
          payload: { id: conventionEndingTomorrow.id },
        },
      ]);
    });

    it("Does not send an email to immersions having already received one", async () => {
      // Arrange

      const notification: Notification = {
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
            beneficiaryFirstName:
              conventionEndingYesterday.signatories.beneficiary.firstName,
            beneficiaryLastName:
              conventionEndingYesterday.signatories.beneficiary.lastName,
            conventionId: conventionEndingYesterday.id,
            establishmentTutorName: `${conventionEndingYesterday.establishmentTutor.firstName} ${conventionEndingYesterday.establishmentTutor.lastName}`,
            agencyLogoUrl: undefined,
          },
          recipients: [conventionEndingYesterday.establishmentTutor.email],
          sender: {
            email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
            name: "Immersion Facilitée",
          },
        },
      };

      uow.conventionRepository.setConventions([conventionEndingYesterday]);
      uow.notificationRepository.notifications = [notification];

      expectToEqual(uow.outboxRepository.events, []);

      // Act
      await sendEmailWithAssessmentCreationLink.execute({
        conventionEndDate: {
          from: oneDayAgo,
          to: now,
        },
      });

      // Assert
      expectToEqual(uow.notificationRepository.notifications, [notification]);
      expectToEqual(uow.outboxRepository.events, []);
    });
  });

  describe("Wrong paths", () => {
    it("throws on missing user", async () => {
      // Arrange

      uow.conventionRepository.setConventions([
        conventionEndingTomorrow,
        conventionEndingInTwoDays,
      ]);
      uow.userRepository.users = [];

      // Act
      expectPromiseToFailWithError(
        sendEmailWithAssessmentCreationLink.execute({
          conventionEndDate: {
            from: now,
            to: inOneDay,
          },
        }),
        errors.users.notFound({ userIds: [counsellor.id] }),
      );
    });

    it("throws on missing agency", async () => {
      // Arrange

      uow.conventionRepository.setConventions([
        conventionEndingTomorrow,
        conventionEndingInTwoDays,
      ]);
      uow.agencyRepository.agencies = [];

      // Act
      expectPromiseToFailWithError(
        sendEmailWithAssessmentCreationLink.execute({
          conventionEndDate: {
            from: now,
            to: inOneDay,
          },
        }),
        errors.agency.notFound({ agencyId: agency.id }),
      );
    });
  });
});
