import {
  ConventionDtoBuilder,
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
  makeNotifyConventionBeneficiariesThatEstablishmentIsBanned,
  type NotifyConventionBeneficiariesThatEstablishmentIsBanned,
} from "./NotifyConventionBeneficiariesThatEstablishmentIsBanned";

describe("NotifyConventionBeneficiariesThatEstablishmentIsBanned", () => {
  let uow: InMemoryUnitOfWork;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  let notifyConventionBeneficiariesThatEstablishmentIsBanned: NotifyConventionBeneficiariesThatEstablishmentIsBanned;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  const adminUser = new UserBuilder()
    .withId("admin-id")
    .withEmail("admin@company.com")
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
    ])
    .withBannishmentInformations({
      isEstablishmentBanned: true,
      establishmentBannishmentJustification: "Traite ses employés de ploucs",
    })
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
    notifyConventionBeneficiariesThatEstablishmentIsBanned =
      makeNotifyConventionBeneficiariesThatEstablishmentIsBanned({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          saveNotificationAndRelatedEvent,
          immersionBaseUrl: "https://immersion-facile.beta.gouv.fr",
        },
      });
    uow.establishmentAggregateRepository.establishmentAggregates = [
      bannedEstablishmentAggregate,
    ];
    uow.userRepository.users = [adminUser];

    uow.conventionRepository.setConventions([
      readyToSignConvention,
      partiallySignedConvention,
      inReviewConvention,
      acceptedByCounsellorConvention,
      validatedConvention,
    ]);
  });

  describe("Wrong path", () => {
    it("throws when establishment is not found", async () => {
      await expectPromiseToFailWithError(
        notifyConventionBeneficiariesThatEstablishmentIsBanned.execute({
          siret: "00000000000000",
        }),
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
        notifyConventionBeneficiariesThatEstablishmentIsBanned.execute({
          siret: notBannedEstablishment.establishment.siret,
        }),
        errors.establishment.establishmentNotBanned({
          siret: notBannedEstablishment.establishment.siret,
        }),
      );
    });
  });

  describe("Right path", () => {
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
    ])("notifies beneficiary in affected convention statuses", async ({
      convention,
    }) => {
      uow.conventionRepository.setConventions([convention]);

      await notifyConventionBeneficiariesThatEstablishmentIsBanned.execute({
        siret: bannedEstablishmentAggregate.establishment.siret,
      });

      expectSavedNotificationsAndEvents({
        emails: [
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

    it("notifies only beneficiaries with conventions in affected statuses", async () => {
      uow.conventionRepository.setConventions([
        readyToSignConvention,
        partiallySignedConvention,
        validatedConvention,
      ]);

      await notifyConventionBeneficiariesThatEstablishmentIsBanned.execute({
        siret: bannedEstablishmentAggregate.establishment.siret,
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_BENEFICIARY",
            recipients: [readyToSignConvention.signatories.beneficiary.email],
            params: {
              businessName: bannedEstablishmentAggregate.establishment.name,
              beneficiaryFirstName:
                readyToSignConvention.signatories.beneficiary.firstName,
              beneficiaryLastName:
                readyToSignConvention.signatories.beneficiary.lastName,
              immersionBaseUrl: "https://immersion-facile.beta.gouv.fr",
            },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_BENEFICIARY",
            recipients: [
              partiallySignedConvention.signatories.beneficiary.email,
            ],
            params: {
              businessName: bannedEstablishmentAggregate.establishment.name,
              beneficiaryFirstName:
                partiallySignedConvention.signatories.beneficiary.firstName,
              beneficiaryLastName:
                partiallySignedConvention.signatories.beneficiary.lastName,
              immersionBaseUrl: "https://immersion-facile.beta.gouv.fr",
            },
          },
        ],
      });
    });

    it("sends no email when there are no conventions with target statuses", async () => {
      uow.conventionRepository.setConventions([]);

      await notifyConventionBeneficiariesThatEstablishmentIsBanned.execute({
        siret: bannedEstablishmentAggregate.establishment.siret,
      });

      expectSavedNotificationsAndEvents({ emails: [] });
    });
  });
});
