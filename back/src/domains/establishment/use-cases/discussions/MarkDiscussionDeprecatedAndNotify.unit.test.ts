import {
  DiscussionBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { makeSaveNotificationsBatchAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type MarkDiscussionDeprecatedAndNotify,
  makeMarkDiscussionDeprecatedAndNotify,
} from "./MarkDiscussionDeprecatedAndNotify";

describe("MarkDiscussionDeprecatedAndNotify", () => {
  let uow: InMemoryUnitOfWork;
  let markDiscussionDeprecatedAndNotify: MarkDiscussionDeprecatedAndNotify;
  let uuidGenerator: TestUuidGenerator;
  let appConfig: AppConfig;
  let timeGateway: TimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    uow.discussionRepository.discussions = [];
    uuidGenerator = new TestUuidGenerator();
    timeGateway = new CustomTimeGateway();
    appConfig = new AppConfigBuilder().build();
    markDiscussionDeprecatedAndNotify = makeMarkDiscussionDeprecatedAndNotify({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationsBatchAndRelatedEvent:
          makeSaveNotificationsBatchAndRelatedEvent(uuidGenerator, timeGateway),
        config: appConfig,
      },
    });
  });

  it("should throw an error if discussion is not found", async () => {
    const notFoundDiscussionId = "11111111-1111-a111-1111-111111111111";
    await expectPromiseToFailWithError(
      markDiscussionDeprecatedAndNotify.execute({
        discussionId: notFoundDiscussionId,
      }),
      errors.discussion.notFound({ discussionId: notFoundDiscussionId }),
    );
  });

  it("should throw an error if discussion is already rejected", async () => {
    const obsoleteDiscussionId = "11111111-1111-a111-1111-111111111111";
    const obsoleteDiscussion = new DiscussionBuilder()
      .withId(obsoleteDiscussionId)
      .withStatus({
        status: "REJECTED",
        rejectionKind: "NO_TIME",
      })
      .build();
    uow.discussionRepository.discussions = [obsoleteDiscussion];
    await expectPromiseToFailWithError(
      markDiscussionDeprecatedAndNotify.execute({
        discussionId: obsoleteDiscussionId,
      }),
      errors.discussion.badStatus({
        discussionId: obsoleteDiscussionId,
        status: "PENDING",
      }),
    );
  });

  it("should throw an error if discussion is already accepted", async () => {
    const obsoleteDiscussionId = "11111111-1111-a111-1111-111111111111";
    const obsoleteDiscussion = new DiscussionBuilder()
      .withId(obsoleteDiscussionId)
      .withStatus({
        status: "ACCEPTED",
        candidateWarnedMethod: "email",
      })
      .build();
    uow.discussionRepository.discussions = [obsoleteDiscussion];
    await expectPromiseToFailWithError(
      markDiscussionDeprecatedAndNotify.execute({
        discussionId: obsoleteDiscussionId,
      }),
      errors.discussion.badStatus({
        discussionId: obsoleteDiscussionId,
        status: "PENDING",
      }),
    );
  });

  it("should emit beneficiary and establishment notifications when discussion is deprecated", async () => {
    const expectedNotificationIds = ["notification-id-1", "notification-id-2"];
    const obsoleteDiscussionId = "11111111-1111-a111-1111-111111111111";
    const obsoleteDiscussion = new DiscussionBuilder()
      .withId(obsoleteDiscussionId)
      .build();

    uow.discussionRepository.discussions = [obsoleteDiscussion];
    uuidGenerator.setNextUuids(expectedNotificationIds);

    await markDiscussionDeprecatedAndNotify.execute({
      discussionId: obsoleteDiscussionId,
    });

    expect(uow.notificationRepository.notifications).toHaveLength(2);
    expectToEqual(uow.notificationRepository.notifications, [
      {
        createdAt: "2021-09-01T10:10:00.000Z",
        followedIds: {
          establishmentSiret: obsoleteDiscussion.siret,
        },
        id: expectedNotificationIds[0],
        kind: "email",
        templatedContent: {
          kind: "DISCUSSION_DEPRECATED_NOTIFICATION_ESTABLISHMENT",
          params: {
            beneficiaryFirstName:
              obsoleteDiscussion.potentialBeneficiary.firstName,
            beneficiaryLastName:
              obsoleteDiscussion.potentialBeneficiary.lastName,
            businessName: obsoleteDiscussion.businessName,
            ctaUrl: "http://localhost/tableau-de-bord-etablissement",
            discussionCreatedAt: obsoleteDiscussion.createdAt,
            establishmentContactFirstName:
              // biome-ignore lint/style/noNonNullAssertion: test purpose
              obsoleteDiscussion.establishmentContact.firstName!,
            establishmentContactLastName:
              // biome-ignore lint/style/noNonNullAssertion: test purpose
              obsoleteDiscussion.establishmentContact.lastName!,
          },
          recipients: [obsoleteDiscussion.establishmentContact.email],
        },
      },
      {
        createdAt: "2021-09-01T10:10:00.000Z",
        followedIds: {
          establishmentSiret: obsoleteDiscussion.siret,
        },
        id: expectedNotificationIds[1],
        kind: "email",
        templatedContent: {
          kind: "DISCUSSION_DEPRECATED_NOTIFICATION_BENEFICIARY",
          params: {
            beneficiaryFirstName:
              obsoleteDiscussion.potentialBeneficiary.firstName,
            beneficiaryLastName:
              obsoleteDiscussion.potentialBeneficiary.lastName,
            businessName: obsoleteDiscussion.businessName,
            ctaUrl: "http://localhost/recherche",
            discussionCreatedAt: obsoleteDiscussion.createdAt,
          },
          recipients: [obsoleteDiscussion.potentialBeneficiary.email],
        },
      },
    ]);
  });
});
