import {
  DiscussionBuilder,
  type DiscussionDto,
  InclusionConnectedUserBuilder,
  type RejectDiscussionAndSendNotificationParam,
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
import { EstablishmentAggregateBuilder } from "../../helpers/EstablishmentBuilders";
import {
  type RejectDiscussionAndSendNotification,
  makeRejectDiscussionAndSendNotification,
} from "./RejectDiscussionAndSendNotification";

describe("RejectDiscussionAndSendNotification", () => {
  const authorizedUser = new InclusionConnectedUserBuilder()
    .withId("authorizedUser")
    .withEmail("authorized@domain.com")
    .build();
  const unauthorizedUser = new InclusionConnectedUserBuilder()
    .withEmail("unauthorized@domain.com")
    .withId("unauthorizedUser")
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
          authorizedUser,
        ),
        errors.discussion.notFound({ discussionId: discussion.id }),
      );
    });

    it("throws ForbiddenError if user is not allowed to reject this discussion", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(discussion.siret)
          .withUserRights([
            {
              role: "establishment-admin",
              userId: "other-user",
              job: "",
              phone: "",
            },
          ])
          .build(),
      ];

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

    it("throws notFound on missing establishment", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [];

      await expectPromiseToFailWithError(
        rejectPotentialBeneficiaryOnDiscussion.execute(
          {
            discussionId: discussion.id,
            rejectionKind: "UNABLE_TO_HELP",
          },
          unauthorizedUser,
        ),
        errors.establishment.notFound({
          siret: discussion.siret,
        }),
      );
    });
  });

  describe("Right paths", () => {
    describe("validate each possible statuses", () => {
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
            discussion.establishmentContact.firstName,
            discussion.establishmentContact.lastName,
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
                recipients: [
                  `${discussion.potentialBeneficiary.firstName}_${discussion.potentialBeneficiary.lastName}__${discussion.id}_b@reply-domain`,
                ],
                replyTo: {
                  email: `${discussion.establishmentContact.firstName}_${discussion.establishmentContact.lastName}__${discussion.id}_e@reply-domain`,
                  name: `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`,
                },
              },
            ],
          });
        },
      );
    });

    describe("validate user rights", () => {
      describe("when user email is on discussion", () => {
        it("allow rejection when user email is on discussion main contact", async () => {
          const params: RejectDiscussionAndSendNotificationParam = {
            discussionId: discussion.id,
            rejectionKind: "NO_TIME",
          };

          await rejectPotentialBeneficiaryOnDiscussion.execute(
            params,
            authorizedUser,
          );

          const { htmlContent, subject } = makeExpectedEmailParams(
            "l’entreprise traverse une période chargée et n’a pas le temps d’accueillir une immersion.",
            discussion.establishmentContact.firstName,
            discussion.establishmentContact.lastName,
          );

          expectToEqual(uow.discussionRepository.discussions, [
            {
              ...discussion,
              status: "REJECTED",
              rejectionKind: params.rejectionKind,
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
                recipients: [
                  `${discussion.potentialBeneficiary.firstName}_${discussion.potentialBeneficiary.lastName}__${discussion.id}_b@reply-domain`,
                ],
                replyTo: {
                  email: `${discussion.establishmentContact.firstName}_${discussion.establishmentContact.lastName}__${discussion.id}_e@reply-domain`,
                  name: `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`,
                },
              },
            ],
          });
        });

        it("allow rejection when user email is on discussion copy contacts", async () => {
          const discussionWithEmailInCopy = new DiscussionBuilder(discussion)
            .withEstablishmentContact({
              firstName: "other",
              lastName: "guy",
              email: "other.mail.com",
              copyEmails: [authorizedUser.email],
            })
            .build();

          uow.discussionRepository.discussions = [discussionWithEmailInCopy];

          const params: RejectDiscussionAndSendNotificationParam = {
            discussionId: discussionWithEmailInCopy.id,
            rejectionKind: "NO_TIME",
          };

          await rejectPotentialBeneficiaryOnDiscussion.execute(
            params,
            authorizedUser,
          );

          const { htmlContent, subject } = makeExpectedEmailParams(
            "l’entreprise traverse une période chargée et n’a pas le temps d’accueillir une immersion.",
            discussionWithEmailInCopy.establishmentContact.firstName,
            discussionWithEmailInCopy.establishmentContact.lastName,
          );

          expectToEqual(uow.discussionRepository.discussions, [
            {
              ...discussionWithEmailInCopy,
              status: "REJECTED",
              rejectionKind: params.rejectionKind,
              exchanges: [
                ...discussionWithEmailInCopy.exchanges,
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
                recipients: [
                  `${discussionWithEmailInCopy.potentialBeneficiary.firstName}_${discussionWithEmailInCopy.potentialBeneficiary.lastName}__${discussionWithEmailInCopy.id}_b@reply-domain`,
                ],
                replyTo: {
                  email: `${discussionWithEmailInCopy.establishmentContact.firstName}_${discussionWithEmailInCopy.establishmentContact.lastName}__${discussionWithEmailInCopy.id}_e@reply-domain`,
                  name: `${discussionWithEmailInCopy.establishmentContact.firstName} ${discussionWithEmailInCopy.establishmentContact.lastName} - ${discussionWithEmailInCopy.businessName}`,
                },
              },
            ],
          });
        });
      });

      describe("when user have establishment right", () => {
        const discussionWithoutUserEmail = new DiscussionBuilder()
          .withEstablishmentContact({
            email: "other1@mail.com",
            copyEmails: ["other2@mail.com"],
          })
          .build();

        beforeEach(() => {
          uow.discussionRepository.discussions = [discussionWithoutUserEmail];
        });

        it("allow rejection when user is establishment admin", async () => {
          uow.establishmentAggregateRepository.establishmentAggregates = [
            new EstablishmentAggregateBuilder()
              .withEstablishmentSiret(discussionWithoutUserEmail.siret)
              .withUserRights([
                {
                  role: "establishment-admin",
                  userId: authorizedUser.id,
                  job: "",
                  phone: "",
                },
              ])
              .build(),
          ];

          const params: RejectDiscussionAndSendNotificationParam = {
            discussionId: discussionWithoutUserEmail.id,
            rejectionKind: "NO_TIME",
          };

          await rejectPotentialBeneficiaryOnDiscussion.execute(
            params,
            authorizedUser,
          );

          const { htmlContent, subject } = makeExpectedEmailParams(
            "l’entreprise traverse une période chargée et n’a pas le temps d’accueillir une immersion.",
            discussionWithoutUserEmail.establishmentContact.firstName,
            discussionWithoutUserEmail.establishmentContact.lastName,
          );

          expectToEqual(uow.discussionRepository.discussions, [
            {
              ...discussionWithoutUserEmail,
              status: "REJECTED",
              rejectionKind: params.rejectionKind,
              exchanges: [
                ...discussionWithoutUserEmail.exchanges,
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
                recipients: [
                  `${discussionWithoutUserEmail.potentialBeneficiary.firstName}_${discussionWithoutUserEmail.potentialBeneficiary.lastName}__${discussionWithoutUserEmail.id}_b@reply-domain`,
                ],
                replyTo: {
                  email: `${discussionWithoutUserEmail.establishmentContact.firstName}_${discussionWithoutUserEmail.establishmentContact.lastName}__${discussionWithoutUserEmail.id}_e@reply-domain`,
                  name: `${discussionWithoutUserEmail.establishmentContact.firstName} ${discussionWithoutUserEmail.establishmentContact.lastName} - ${discussionWithoutUserEmail.businessName}`,
                },
              },
            ],
          });
        });

        it("allow rejection when user is establishment contact", async () => {
          uow.establishmentAggregateRepository.establishmentAggregates = [
            new EstablishmentAggregateBuilder()
              .withEstablishmentSiret(discussionWithoutUserEmail.siret)
              .withUserRights([
                {
                  role: "establishment-admin",
                  userId: "other-user-id",
                  job: "",
                  phone: "",
                },
                {
                  role: "establishment-contact",
                  userId: authorizedUser.id,
                },
              ])
              .build(),
          ];

          const params: RejectDiscussionAndSendNotificationParam = {
            discussionId: discussionWithoutUserEmail.id,
            rejectionKind: "NO_TIME",
          };

          await rejectPotentialBeneficiaryOnDiscussion.execute(
            params,
            authorizedUser,
          );

          const { htmlContent, subject } = makeExpectedEmailParams(
            "l’entreprise traverse une période chargée et n’a pas le temps d’accueillir une immersion.",
            discussionWithoutUserEmail.establishmentContact.firstName,
            discussionWithoutUserEmail.establishmentContact.lastName,
          );

          expectToEqual(uow.discussionRepository.discussions, [
            {
              ...discussionWithoutUserEmail,
              status: "REJECTED",
              rejectionKind: params.rejectionKind,
              exchanges: [
                ...discussionWithoutUserEmail.exchanges,
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
                recipients: [
                  `${discussionWithoutUserEmail.potentialBeneficiary.firstName}_${discussionWithoutUserEmail.potentialBeneficiary.lastName}__${discussionWithoutUserEmail.id}_b@reply-domain`,
                ],
                replyTo: {
                  email: `${discussionWithoutUserEmail.establishmentContact.firstName}_${discussionWithoutUserEmail.establishmentContact.lastName}__${discussionWithoutUserEmail.id}_e@reply-domain`,
                  name: `${discussionWithoutUserEmail.establishmentContact.firstName} ${discussionWithoutUserEmail.establishmentContact.lastName} - ${discussionWithoutUserEmail.businessName}`,
                },
              },
            ],
          });
        });
      });
    });
  });
});

const makeExpectedEmailParams = (
  expectedRejectionReason: string,
  firstName: string,
  lastName: string,
) => ({
  subject:
    "L’entreprise My default business name ne souhaite pas donner suite à votre candidature à l’immersion",
  htmlContent: `Bonjour, 
  
Malheureusement, nous ne souhaitons pas donner suite à votre candidature à l’immersion.

La raison du refus est : ${expectedRejectionReason}

N’hésitez pas à <a href="https://immersion-facile.beta.gouv.fr/recherche">rechercher une immersion dans une autre entreprise</a> !

Bonne journée, 
${firstName} ${lastName}, représentant de l'entreprise My default business name`,
});
