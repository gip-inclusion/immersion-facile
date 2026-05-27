import {
  ConventionDtoBuilder,
  DiscussionBuilder,
  errors,
  expectPromiseToFailWithError,
  UserBuilder,
} from "shared";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import {
  makeSaveNotificationAndRelatedEvent,
  type SaveNotificationAndRelatedEvent,
} from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { EstablishmentAggregateBuilder } from "../../helpers/EstablishmentBuilders";
import {
  makeNotifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned,
  type NotifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned,
} from "./NotifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned";

const immersionBaseUrl = "https://immersion-facile.beta.gouv.fr";

describe("NotifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned", () => {
  let uow: InMemoryUnitOfWork;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  let notifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned: NotifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  const adminUser = new UserBuilder()
    .withId("admin-id")
    .withEmail("admin@company.com")
    .build();

  const contactUser = new UserBuilder()
    .withId("contact-id")
    .withEmail("contact@company.com")
    .build();

  const pendingContactUser = new UserBuilder()
    .withId("pending-contact-id")
    .withEmail("pending.contact@company.com")
    .build();

  const bannedEstablishmentAggregate = new EstablishmentAggregateBuilder()
    .withUserRights([
      {
        role: "establishment-admin",
        userId: adminUser.id,
        status: "ACCEPTED",
        shouldReceiveDiscussionNotifications: true,
        isMainContactByPhone: false,
        job: "CEO",
        phone: "0600000000",
      },
      {
        role: "establishment-contact",
        userId: contactUser.id,
        status: "ACCEPTED",
        shouldReceiveDiscussionNotifications: true,
        isMainContactByPhone: false,
        job: "HR",
        phone: "0600000001",
      },
      {
        role: "establishment-contact",
        userId: pendingContactUser.id,
        status: "PENDING",
        shouldReceiveDiscussionNotifications: true,
        isMainContactByPhone: false,
        job: "Manager",
        phone: "0600000002",
      },
    ])
    .withBannishmentInformations({
      isEstablishmentBanned: true,
      establishmentBannishmentJustification:
        "Ils font de la pêche à pied intensive dans la baie de Saint-Brieuc",
    })
    .build();

  const siret = bannedEstablishmentAggregate.establishment.siret;
  const businessName = bannedEstablishmentAggregate.establishment.name;

  const pendingDiscussion = new DiscussionBuilder()
    .withSiret(siret)
    .withStatus({ status: "PENDING" })
    .withPotentialBeneficiaryEmail("pending-beneficiary@test.com")
    .build();

  const readyToSignConvention = new ConventionDtoBuilder()
    .withId("aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa")
    .withSiret(bannedEstablishmentAggregate.establishment.siret)
    .withStatus("READY_TO_SIGN")
    .withBeneficiaryEmail("beneficiary-ready-to-sign@test.com")
    .build();

  const partiallySignedConvention = new ConventionDtoBuilder()
    .withId("bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb")
    .withSiret(bannedEstablishmentAggregate.establishment.siret)
    .withStatus("PARTIALLY_SIGNED")
    .withBeneficiaryEmail("beneficiary-partially-signed@test.com")
    .withBeneficiaryFirstName("Pierre")
    .withBeneficiaryLastName("Durand")
    .build();

  const inReviewConvention = new ConventionDtoBuilder()
    .withId("cccccccc-cccc-4ccc-accc-cccccccccccc")
    .withSiret(bannedEstablishmentAggregate.establishment.siret)
    .withStatus("IN_REVIEW")
    .withBeneficiaryEmail("beneficiary-in-review@test.com")
    .withBeneficiaryFirstName("Marie")
    .withBeneficiaryLastName("Dupont")
    .build();

  const acceptedByCounsellorConvention = new ConventionDtoBuilder()
    .withId("dddddddd-dddd-4ddd-addd-dddddddddddd")
    .withSiret(bannedEstablishmentAggregate.establishment.siret)
    .withStatus("ACCEPTED_BY_COUNSELLOR")
    .withBeneficiaryEmail("beneficiary-accepted-by-counsellor@test.com")
    .withBeneficiaryFirstName("Julie")
    .withBeneficiaryLastName("Bernard")
    .build();

  const validatedConvention = new ConventionDtoBuilder()
    .withId("eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee")
    .withSiret(bannedEstablishmentAggregate.establishment.siret)
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withBeneficiaryEmail("beneficiary-validated@test.com")
    .build();

  beforeEach(() => {
    uow = createInMemoryUow();
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      new UuidV4Generator(),
      new CustomTimeGateway(),
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    notifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned =
      makeNotifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: { saveNotificationAndRelatedEvent, immersionBaseUrl },
      });
    uow.userRepository.users = [adminUser, contactUser, pendingContactUser];
    uow.establishmentAggregateRepository.establishmentAggregates = [
      bannedEstablishmentAggregate,
    ];
  });

  describe("Wrong path", () => {
    it("throws when establishment is not found", async () => {
      await expectPromiseToFailWithError(
        notifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned.execute(
          { siret: "00000000000000" },
        ),
        errors.establishment.notFound({ siret: "00000000000000" }),
      );
    });

    it("throws when establishment is not banned", async () => {
      const notBannedEstablishment = new EstablishmentAggregateBuilder(
        bannedEstablishmentAggregate,
      )
        .withBannishmentInformations({ isEstablishmentBanned: false })
        .build();

      uow.establishmentAggregateRepository.establishmentAggregates = [
        notBannedEstablishment,
      ];

      await expectPromiseToFailWithError(
        notifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned.execute(
          { siret: notBannedEstablishment.establishment.siret },
        ),
        errors.establishment.establishmentNotBanned({
          siret: notBannedEstablishment.establishment.siret,
        }),
      );
    });
  });

  describe("Right path", () => {
    it("sends emails to accepted admin and contact users only", async () => {
      await notifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned.execute(
        { siret },
      );

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [adminUser.email],
            params: { businessName, siret },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [contactUser.email],
            params: { businessName, siret },
          },
        ],
      });
    });

    it("sends emails to pending discussion beneficiaries only", async () => {
      const acceptedDiscussion = new DiscussionBuilder()
        .withId("bbbbbbbb-bbbb-4444-bbbb-bbbbbbbbbbbb")
        .withSiret(siret)
        .withStatus({ status: "ACCEPTED", candidateWarnedMethod: "email" })
        .withPotentialBeneficiaryEmail("accepted-beneficiary@test.com")
        .build();

      uow.discussionRepository.discussions = [
        pendingDiscussion,
        acceptedDiscussion,
      ];

      await notifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned.execute(
        { siret },
      );

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [adminUser.email],
            params: { businessName, siret },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [contactUser.email],
            params: { businessName, siret },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_BENEFICIARY",
            recipients: [pendingDiscussion.potentialBeneficiary.email],
            params: {
              businessName,
              beneficiaryFirstName:
                pendingDiscussion.potentialBeneficiary.firstName,
              beneficiaryLastName:
                pendingDiscussion.potentialBeneficiary.lastName,
              immersionBaseUrl,
            },
          },
        ],
      });
    });

    it("sends no discussion beneficiary email when there are no pending discussions", async () => {
      await notifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned.execute(
        { siret },
      );

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [adminUser.email],
            params: { businessName, siret },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [contactUser.email],
            params: { businessName, siret },
          },
        ],
      });
    });

    it.each([
      {
        convention: readyToSignConvention,
        expectedEmail: "beneficiary-ready-to-sign@test.com",
      },
      {
        convention: partiallySignedConvention,
        expectedEmail: "beneficiary-partially-signed@test.com",
      },
      {
        convention: inReviewConvention,
        expectedEmail: "beneficiary-in-review@test.com",
      },
      {
        convention: acceptedByCounsellorConvention,
        expectedEmail: "beneficiary-accepted-by-counsellor@test.com",
      },
    ])("sends emails to beneficiary in affected convention statuses", async ({
      convention,
    }) => {
      uow.conventionRepository.setConventions([convention]);

      await notifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned.execute(
        {
          siret: bannedEstablishmentAggregate.establishment.siret,
        },
      );

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [adminUser.email],
            params: { businessName, siret },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [contactUser.email],
            params: { businessName, siret },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_BENEFICIARY",
            recipients: [convention.signatories.beneficiary.email],
            params: {
              businessName: bannedEstablishmentAggregate.establishment.name,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              immersionBaseUrl: "https://immersion-facile.beta.gouv.fr",
            },
          },
        ],
      });
    });

    it("sends emails to convention beneficiaries in affected statuses only", async () => {
      uow.conventionRepository.setConventions([
        readyToSignConvention,
        validatedConvention,
      ]);

      await notifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned.execute(
        { siret },
      );

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [adminUser.email],
            params: { businessName, siret },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [contactUser.email],
            params: { businessName, siret },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_BENEFICIARY",
            recipients: [readyToSignConvention.signatories.beneficiary.email],
            params: {
              businessName,
              beneficiaryFirstName:
                readyToSignConvention.signatories.beneficiary.firstName,
              beneficiaryLastName:
                readyToSignConvention.signatories.beneficiary.lastName,
              immersionBaseUrl,
            },
          },
        ],
      });
    });

    it("sends no convention email when there are no conventions in affected statuses", async () => {
      uow.conventionRepository.setConventions([]);

      await notifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned.execute(
        { siret },
      );

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [adminUser.email],
            params: { businessName, siret },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [contactUser.email],
            params: { businessName, siret },
          },
        ],
      });
    });

    it("sends all notification types", async () => {
      uow.discussionRepository.discussions = [pendingDiscussion];
      uow.conventionRepository.setConventions([readyToSignConvention]);

      await notifyEstablishmentUsersAndBeneficiariesThatEstablishmentIsBanned.execute(
        { siret },
      );

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [adminUser.email],
            params: { businessName, siret },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [contactUser.email],
            params: { businessName, siret },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_BENEFICIARY",
            recipients: [pendingDiscussion.potentialBeneficiary.email],
            params: {
              businessName,
              beneficiaryFirstName:
                pendingDiscussion.potentialBeneficiary.firstName,
              beneficiaryLastName:
                pendingDiscussion.potentialBeneficiary.lastName,
              immersionBaseUrl,
            },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_BENEFICIARY",
            recipients: [readyToSignConvention.signatories.beneficiary.email],
            params: {
              businessName,
              beneficiaryFirstName:
                readyToSignConvention.signatories.beneficiary.firstName,
              beneficiaryLastName:
                readyToSignConvention.signatories.beneficiary.lastName,
              immersionBaseUrl,
            },
          },
        ],
      });
    });
  });
});
