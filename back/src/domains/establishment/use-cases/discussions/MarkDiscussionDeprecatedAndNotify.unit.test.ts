import {
  ConnectedUserBuilder,
  DiscussionBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { makeSaveNotificationsBatchAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { EstablishmentAggregateBuilder } from "../../helpers/EstablishmentBuilders";
import {
  type MarkDiscussionDeprecatedAndNotify,
  makeMarkDiscussionDeprecatedAndNotify,
} from "./MarkDiscussionDeprecatedAndNotify";

describe("MarkDiscussionDeprecatedAndNotify", () => {
  const discussion = new DiscussionBuilder()
    .withId("11111111-1111-4111-a111-111111111111")
    .build();

  const admin = new ConnectedUserBuilder()
    .withId("admin")
    .withEmail("admin@establishment.com")
    .buildUser();
  const contact = new ConnectedUserBuilder()
    .withId("contact")
    .withEmail("contact@establishment.com")
    .buildUser();

  const expectedNotificationIds = ["notification-id-1", "notification-id-2"];

  let uow: InMemoryUnitOfWork;
  let markDiscussionDeprecatedAndNotify: MarkDiscussionDeprecatedAndNotify;

  beforeEach(() => {
    const uuidGenerator = new TestUuidGenerator();

    uow = createInMemoryUow();
    markDiscussionDeprecatedAndNotify = makeMarkDiscussionDeprecatedAndNotify({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationsBatchAndRelatedEvent:
          makeSaveNotificationsBatchAndRelatedEvent(
            uuidGenerator,
            new CustomTimeGateway(),
          ),
        config: new AppConfigBuilder().build(),
      },
    });

    uuidGenerator.setNextUuids(expectedNotificationIds);
    uow.discussionRepository.discussions = [discussion];
    uow.establishmentAggregateRepository.establishmentAggregates = [
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(discussion.siret)
        .withUserRights([
          {
            role: "establishment-admin",
            userId: admin.id,
            shouldReceiveDiscussionNotifications: true,
            job: "osef",
            phone: "osef",
            isMainContactByPhone: false,
          },
          {
            role: "establishment-contact",
            userId: contact.id,
            shouldReceiveDiscussionNotifications: true,
          },
          {
            role: "establishment-contact",
            userId: "not-notified-user",
            shouldReceiveDiscussionNotifications: false,
          },
        ])
        .build(),
    ];
    uow.userRepository.users = [admin, contact];
  });

  describe("Wrong paths", () => {
    it("should throw an error if discussion is not found", async () => {
      uow.discussionRepository.discussions = [];

      await expectPromiseToFailWithError(
        markDiscussionDeprecatedAndNotify.execute({
          discussionId: discussion.id,
        }),
        errors.discussion.notFound({ discussionId: discussion.id }),
      );
    });

    it("should throw an error if discussion is already rejected", async () => {
      const obsoleteDiscussion = new DiscussionBuilder(discussion)
        .withStatus({
          status: "REJECTED",
          rejectionKind: "NO_TIME",
        })
        .build();

      uow.discussionRepository.discussions = [obsoleteDiscussion];

      await expectPromiseToFailWithError(
        markDiscussionDeprecatedAndNotify.execute({
          discussionId: obsoleteDiscussion.id,
        }),
        errors.discussion.badStatus({
          discussionId: obsoleteDiscussion.id,
          expectedStatus: "PENDING",
        }),
      );
    });

    it("should throw an error if discussion is already accepted", async () => {
      const alreadyAcceptedDiscussion = new DiscussionBuilder(discussion)
        .withStatus({
          status: "ACCEPTED",
          candidateWarnedMethod: "email",
        })
        .build();

      uow.discussionRepository.discussions = [alreadyAcceptedDiscussion];

      await expectPromiseToFailWithError(
        markDiscussionDeprecatedAndNotify.execute({
          discussionId: alreadyAcceptedDiscussion.id,
        }),
        errors.discussion.badStatus({
          discussionId: alreadyAcceptedDiscussion.id,
          expectedStatus: "PENDING",
        }),
      );
    });

    it("should throw an error if establishment is not found", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [];

      await expectPromiseToFailWithError(
        markDiscussionDeprecatedAndNotify.execute({
          discussionId: discussion.id,
        }),
        errors.establishment.notFound({ siret: discussion.siret }),
      );
    });

    it("should throw an error if users are not found", async () => {
      uow.userRepository.users = [];

      await expectPromiseToFailWithError(
        markDiscussionDeprecatedAndNotify.execute({
          discussionId: discussion.id,
        }),
        errors.users.notFound({ userIds: [admin.id, contact.id] }),
      );
    });
  });

  it("should emit beneficiary and establishment notifications when discussion is deprecated, establishment notification is sent only to user rights with notification enabled", async () => {
    await markDiscussionDeprecatedAndNotify.execute({
      discussionId: discussion.id,
    });

    expectToEqual(uow.notificationRepository.notifications, [
      {
        createdAt: "2021-09-01T10:10:00.000Z",
        followedIds: {
          establishmentSiret: discussion.siret,
        },
        id: expectedNotificationIds[0],
        kind: "email",
        templatedContent: {
          kind: "DISCUSSION_DEPRECATED_NOTIFICATION_ESTABLISHMENT",
          recipients: [admin.email, contact.email],
          params: {
            beneficiaryFirstName: discussion.potentialBeneficiary.firstName,
            beneficiaryLastName: discussion.potentialBeneficiary.lastName,
            businessName: discussion.businessName,
            establishmentDashboardUrl:
              "http://localhost/tableau-de-bord-etablissement",
            discussionCreatedAt: discussion.createdAt,
          },
        },
      },
      {
        createdAt: "2021-09-01T10:10:00.000Z",
        followedIds: {
          establishmentSiret: discussion.siret,
        },
        id: expectedNotificationIds[1],
        kind: "email",
        templatedContent: {
          kind: "DISCUSSION_DEPRECATED_NOTIFICATION_BENEFICIARY",
          recipients: [discussion.potentialBeneficiary.email],
          params: {
            beneficiaryFirstName: discussion.potentialBeneficiary.firstName,
            beneficiaryLastName: discussion.potentialBeneficiary.lastName,
            businessName: discussion.businessName,
            searchPageUrl: "http://localhost/recherche",
            discussionCreatedAt: discussion.createdAt,
          },
        },
      },
    ]);
  });
});
