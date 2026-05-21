import {
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
  makeNotifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned,
  type NotifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned,
} from "./NotifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned";

describe("NotifyDiscussionCandidatesThatEstablishmentIsBanned", () => {
  let uow: InMemoryUnitOfWork;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  let notifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned: NotifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned;
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
      establishmentBannishmentJustification:
        "Espionnage industriel contre la COOPERL",
    })
    .build();

  const pendingDiscussion = new DiscussionBuilder()
    .withSiret(bannedEstablishmentAggregate.establishment.siret)
    .withStatus({ status: "PENDING" })
    .withPotentialBeneficiaryEmail("pending-potentialBeneficiary@test.com")
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
    notifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned =
      makeNotifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          saveNotificationAndRelatedEvent,
          immersionBaseUrl: "https://immersion-facile.beta.gouv.fr/recherche",
        },
      });
    uow.establishmentAggregateRepository.establishmentAggregates = [
      bannedEstablishmentAggregate,
    ];
    uow.userRepository.users = [adminUser];
  });

  describe("Wrong path", () => {
    it("throws when establishment is not found", async () => {
      await expectPromiseToFailWithError(
        notifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned.execute(
          {
            siret: "00000000000000",
          },
        ),
        errors.establishment.notFound({ siret: "00000000000000" }),
      );
    });

    it("throws when establishment is not banned", async () => {
      const notBannedEstablishmentAggregate = new EstablishmentAggregateBuilder(
        bannedEstablishmentAggregate,
      )
        .withBannishmentInformations({
          isEstablishmentBanned: false,
        })
        .build();

      uow.establishmentAggregateRepository.establishmentAggregates = [
        notBannedEstablishmentAggregate,
      ];

      await expectPromiseToFailWithError(
        notifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned.execute(
          {
            siret: notBannedEstablishmentAggregate.establishment.siret,
          },
        ),
        errors.establishment.establishmentNotBanned({
          siret: notBannedEstablishmentAggregate.establishment.siret,
        }),
      );
    });
  });

  describe("Right path", () => {
    it("sends emails to potential beneficiaries with PENDING discussions status only", async () => {
      const acceptedDiscussion = new DiscussionBuilder()
        .withId("bbbbbbbb-bbbb-4444-bbbb-bbbbbbbbbbbb")
        .withSiret(bannedEstablishmentAggregate.establishment.siret)
        .withStatus({
          status: "ACCEPTED",
          candidateWarnedMethod: "email",
        })
        .withPotentialBeneficiaryEmail("accepted-potentialBeneficiary@test.com")
        .build();

      const rejectedDiscussion = new DiscussionBuilder()
        .withId("cccccccc-cccc-4444-cccc-cccccccccccc")
        .withSiret(bannedEstablishmentAggregate.establishment.siret)
        .withStatus({ status: "REJECTED", rejectionKind: "NO_TIME" })
        .withPotentialBeneficiaryEmail("rejected-potentialBeneficiary@test.com")
        .withPotentialBeneficiaryFirstname("Julian")
        .withPotentialBeneficiaryLastName("Le Rouzac")
        .build();

      uow.discussionRepository.discussions = [
        pendingDiscussion,
        acceptedDiscussion,
        rejectedDiscussion,
      ];

      await notifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned.execute(
        {
          siret: bannedEstablishmentAggregate.establishment.siret,
        },
      );

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_BENEFICIARY",
            recipients: [pendingDiscussion.potentialBeneficiary.email],
            params: {
              businessName: bannedEstablishmentAggregate.establishment.name,
              beneficiaryFirstName:
                pendingDiscussion.potentialBeneficiary.firstName,
              beneficiaryLastName:
                pendingDiscussion.potentialBeneficiary.lastName,
              immersionBaseUrl:
                "https://immersion-facile.beta.gouv.fr/recherche",
            },
          },
        ],
      });
    });

    it("sends no email when there are no ongoing discussions", async () => {
      await notifyDiscussionPotentialBeneficiariesThatEstablishmentIsBanned.execute(
        {
          siret: bannedEstablishmentAggregate.establishment.siret,
        },
      );

      expectSavedNotificationsAndEvents({ emails: [] });
    });
  });
});
