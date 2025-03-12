import {
  DiscussionBuilder,
  type DiscussionDto,
  InclusionConnectedUserBuilder,
  RejectDiscussionAndSendNotificationParam,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  immersionFacileNoReplyEmailSender,
} from "shared";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type RejectDiscussionAndSendNotification,
  makeRejectDiscussionAndSendNotification,
} from "./RejectDiscussionAndSendNotification";

describe("RejectDiscussionAndSendNotification", () => {
  const unauthorizedUser = new InclusionConnectedUserBuilder()
    .withEmail("unauthorized@domain.com")
    .withId("unauthorizedUser")
    .build();
  const authorizedUser = new InclusionConnectedUserBuilder()
    .withId("authorizedUser")
    .withEmail("authorized@domain.com")
    .build();
  const discussion = new DiscussionBuilder()
    .withEstablishmentContact({
      email: authorizedUser.email,
    })
    .build();

  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let rejectPotentialBeneficiaryOnDiscussion: RejectDiscussionAndSendNotification;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();

    rejectPotentialBeneficiaryOnDiscussion =
      makeRejectDiscussionAndSendNotification({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          replyDomain: "reply-domain",
          timeGateway,
          saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
            new TestUuidGenerator(),
            timeGateway,
          ),
        },
      });
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    uow.discussionRepository.discussions = [discussion];
  });

  describe("Wrong paths", () => {
    it("throws NotFoundError if discussion is not found", async () => {
      uow.discussionRepository.discussions = [];

      await expectPromiseToFailWithError(
        rejectPotentialBeneficiaryOnDiscussion.execute(
          {
            discussionId: discussion.id,
            rejectionKind: "UNABLE_TO_HELP",
          },
          unauthorizedUser,
        ),
        errors.discussion.notFound({ discussionId: discussion.id }),
      );
    });

    it("throws ForbiddenError if user is not allowed to reject this discussion", async () => {
      await expectPromiseToFailWithError(
        rejectPotentialBeneficiaryOnDiscussion.execute(
          {
            discussionId: discussion.id,
            rejectionKind: "UNABLE_TO_HELP",
          },
          unauthorizedUser,
        ),
        errors.discussion.rejectForbidden({
          discussionId: discussion.id,
          userId: unauthorizedUser.id,
        }),
      );
    });

    it("throws BadRequestError if discussion is already rejected", async () => {
      const alreadyRejectedDiscussion: DiscussionDto = {
        ...discussion,
        status: "REJECTED",
        rejectionKind: "UNABLE_TO_HELP",
      };

      uow.discussionRepository.discussions = [alreadyRejectedDiscussion];

      await expectPromiseToFailWithError(
        rejectPotentialBeneficiaryOnDiscussion.execute(
          {
            discussionId: alreadyRejectedDiscussion.id,
            rejectionKind: "UNABLE_TO_HELP",
          },
          authorizedUser,
        ),
        errors.discussion.alreadyRejected({
          discussionId: alreadyRejectedDiscussion.id,
        }),
      );
    });
  });

  describe("Right paths", () => {
    describe("rejection statuses", () => {
      it.each<{
        params: RejectDiscussionAndSendNotificationParam;
        expectedRejectionReason: string;
      }>([
        {
          params: {
            discussionId: discussion.id,
            rejectionKind: "UNABLE_TO_HELP",
          },
          expectedRejectionReason:
            "l’entreprise estime ne pas être en capacité de vous aider dans votre projet professionnel.",
        },
        {
          params: {
            discussionId: discussion.id,
            rejectionKind: "NO_TIME",
          },
          expectedRejectionReason:
            "l’entreprise traverse une période chargée et n’a pas le temps d’accueillir une immersion.",
        },
        {
          params: {
            discussionId: discussion.id,
            rejectionKind: "OTHER",
            rejectionReason: "my rejection reason",
          },
          expectedRejectionReason: "my rejection reason",
        },
      ])(
        "rejects discussion with kind $params.rejectionKind",
        async ({
          expectedRejectionReason,
          params: { discussionId, ...rest },
        }) => {
          await rejectPotentialBeneficiaryOnDiscussion.execute(
            { discussionId, ...rest },
            authorizedUser,
          );

          const { htmlContent, subject } = makeExpectedEmailParams(
            expectedRejectionReason,
          );

          expectToEqual(uow.discussionRepository.discussions, [
            {
              ...discussion,
              status: "REJECTED",
              ...rest,
              exchanges: [
                ...discussion.exchanges,
                {
                  subject,
                  message: htmlContent,
                  attachments: [],
                  sender: "establishment",
                  recipient: "potentialBeneficiary",
                  sentAt: timeGateway.now().toISOString(),
                },
              ],
            },
          ]);

          expectSavedNotificationsAndEvents({
            emails: [
              {
                kind: "DISCUSSION_EXCHANGE",
                sender: immersionFacileNoReplyEmailSender,
                params: { subject, htmlContent },
                recipients: [`${discussion.id}_b@reply-domain`],
                replyTo: {
                  email: `${discussion.id}_e@reply-domain`,
                  name: `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`,
                },
              },
            ],
          });
        },
      );
    });
  });
});

const makeExpectedEmailParams = (expectedRejectionReason: string) => ({
  subject:
    "L’entreprise My default business name ne souhaite pas donner suite à votre candidature à l’immersion",
  htmlContent: `Bonjour, 
  
Malheureusement, nous ne souhaitons pas donner suite à votre candidature à l’immersion.

La raison du refus est : ${expectedRejectionReason}

N’hésitez pas à <a href="https://immersion-facile.beta.gouv.fr/recherche">rechercher une immersion dans une autre entreprise</a> !

Bonne journée, 
estab lishment, représentant de l'entreprise My default business name`,
});
