import {
  ConventionDtoBuilder,
  DiscussionBuilder,
  type DiscussionDto,
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  InclusionConnectedUserBuilder,
  type UpdateDiscussionStatusParams,
} from "shared";
import type { TriggeredBy } from "../../../core/events/events";
import { makeCreateNewEvent } from "../../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { EstablishmentAggregateBuilder } from "../../helpers/EstablishmentBuilders";
import {
  makeUpdateDiscussionStatus,
  type UpdateDiscussionStatus,
} from "./UpdateDiscussionStatus";

describe("UpdateDiscussionStatus", () => {
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
  let uuidGenerator: TestUuidGenerator;
  let updateDiscussionStatus: UpdateDiscussionStatus;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();

    updateDiscussionStatus = makeUpdateDiscussionStatus({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        timeGateway,
        createNewEvent: makeCreateNewEvent({ timeGateway, uuidGenerator }),
      },
    });

    uow.discussionRepository.discussions = [discussion];
  });

  describe("Wrong paths", () => {
    it("throws NotFoundError if discussion is not found", async () => {
      uow.discussionRepository.discussions = [];

      await expectPromiseToFailWithError(
        updateDiscussionStatus.execute(
          {
            discussionId: discussion.id,
            status: "REJECTED",
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
        updateDiscussionStatus.execute(
          {
            discussionId: discussion.id,
            status: "REJECTED",
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
        updateDiscussionStatus.execute(
          {
            discussionId: alreadyRejectedDiscussion.id,
            status: "REJECTED",
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
        updateDiscussionStatus.execute(
          {
            discussionId: discussion.id,
            status: "REJECTED",
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

  describe("Accept discussion", () => {
    it("accepts a discussion, providing candidateWarnedMethod. Should skip email sending", async () => {
      await updateDiscussionStatus.execute(
        {
          discussionId: discussion.id,
          status: "ACCEPTED",
          candidateWarnedMethod: "inPerson",
        },
        authorizedUser,
      );

      expectDiscussionInRepoAndInOutbox({
        triggeredBy: {
          kind: "inclusion-connected",
          userId: authorizedUser.id,
        },
        expectedDiscussion: {
          ...discussion,
          status: "ACCEPTED",
          candidateWarnedMethod: "inPerson",
        },
        skipSendingEmail: true,
      });
    });

    describe("providing a conventionId", () => {
      it("throws if convention is not found", async () => {
        const conventionId = "40400000-0000-0000-0000-000000000404";

        await expectPromiseToFailWithError(
          updateDiscussionStatus.execute(
            {
              discussionId: discussion.id,
              status: "ACCEPTED",
              candidateWarnedMethod: null,
              conventionId,
            },
            authorizedUser,
          ),
          errors.convention.notFound({ conventionId }),
        );
      });

      it("accepts a discussion, when convention exists", async () => {
        const convention = new ConventionDtoBuilder().build();
        uow.conventionRepository.setConventions([convention]);

        await updateDiscussionStatus.execute(
          {
            discussionId: discussion.id,
            status: "ACCEPTED",
            candidateWarnedMethod: null,
            conventionId: convention.id,
          },
          authorizedUser,
        );

        expectDiscussionInRepoAndInOutbox({
          triggeredBy: {
            kind: "inclusion-connected",
            userId: authorizedUser.id,
          },
          expectedDiscussion: {
            ...discussion,
            status: "ACCEPTED",
            candidateWarnedMethod: null,
            conventionId: convention.id,
          },
          skipSendingEmail: true,
        });
      });
    });
  });

  describe("Reject discussion", () => {
    describe("providing candidateWarnedMethod", () => {
      it("works, and does not send email", async () => {
        await updateDiscussionStatus.execute(
          {
            discussionId: discussion.id,
            status: "REJECTED",
            rejectionKind: "CANDIDATE_ALREADY_WARNED",
            candidateWarnedMethod: "inPerson",
          },
          authorizedUser,
        );

        expectDiscussionInRepoAndInOutbox({
          triggeredBy: {
            kind: "inclusion-connected",
            userId: authorizedUser.id,
          },
          expectedDiscussion: {
            ...discussion,
            status: "REJECTED",
            rejectionKind: "CANDIDATE_ALREADY_WARNED",
            candidateWarnedMethod: "inPerson",
          },
          skipSendingEmail: true,
        });
      });
    });
    describe("validate each possible statuses", () => {
      it.each<{
        params: UpdateDiscussionStatusParams;
        expectedRejectionReason: string;
      }>([
        {
          params: {
            discussionId: discussion.id,
            status: "REJECTED",
            rejectionKind: "UNABLE_TO_HELP",
          },
          expectedRejectionReason:
            "l’entreprise estime ne pas être en capacité de vous aider dans votre projet professionnel.",
        },
        {
          params: {
            discussionId: discussion.id,
            status: "REJECTED",
            rejectionKind: "NO_TIME",
          },
          expectedRejectionReason:
            "l’entreprise traverse une période chargée et n’a pas le temps d’accueillir une immersion.",
        },
        {
          params: {
            discussionId: discussion.id,
            status: "REJECTED",
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
          await updateDiscussionStatus.execute(
            { discussionId, ...rest },
            authorizedUser,
          );

          const { htmlContent, subject } = makeExpectedEmailParams(
            expectedRejectionReason,
            discussion.establishmentContact.firstName,
            discussion.establishmentContact.lastName,
          );

          expectDiscussionInRepoAndInOutbox({
            triggeredBy: {
              kind: "inclusion-connected",
              userId: authorizedUser.id,
            },
            expectedDiscussion: {
              ...discussion,
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
          });
        },
      );
    });

    describe("validate user rights", () => {
      describe("when user email is on discussion", () => {
        it("allow rejection when user email is on discussion main contact", async () => {
          const params: UpdateDiscussionStatusParams = {
            discussionId: discussion.id,
            status: "REJECTED",
            rejectionKind: "NO_TIME",
          };

          await updateDiscussionStatus.execute(params, authorizedUser);

          const { htmlContent, subject } = makeExpectedEmailParams(
            "l’entreprise traverse une période chargée et n’a pas le temps d’accueillir une immersion.",
            discussion.establishmentContact.firstName,
            discussion.establishmentContact.lastName,
          );

          expectDiscussionInRepoAndInOutbox({
            triggeredBy: {
              kind: "inclusion-connected",
              userId: authorizedUser.id,
            },
            expectedDiscussion: {
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

          const params: UpdateDiscussionStatusParams = {
            discussionId: discussionWithEmailInCopy.id,
            status: "REJECTED",
            rejectionKind: "NO_TIME",
          };

          await updateDiscussionStatus.execute(params, authorizedUser);

          const { htmlContent, subject } = makeExpectedEmailParams(
            "l’entreprise traverse une période chargée et n’a pas le temps d’accueillir une immersion.",
            discussionWithEmailInCopy.establishmentContact.firstName,
            discussionWithEmailInCopy.establishmentContact.lastName,
          );

          expectDiscussionInRepoAndInOutbox({
            triggeredBy: {
              kind: "inclusion-connected",
              userId: authorizedUser.id,
            },
            expectedDiscussion: {
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

          const params: UpdateDiscussionStatusParams = {
            discussionId: discussionWithoutUserEmail.id,
            status: "REJECTED",
            rejectionKind: "NO_TIME",
          };

          await updateDiscussionStatus.execute(params, authorizedUser);

          const { htmlContent, subject } = makeExpectedEmailParams(
            "l’entreprise traverse une période chargée et n’a pas le temps d’accueillir une immersion.",
            discussionWithoutUserEmail.establishmentContact.firstName,
            discussionWithoutUserEmail.establishmentContact.lastName,
          );

          expectDiscussionInRepoAndInOutbox({
            triggeredBy: {
              kind: "inclusion-connected",
              userId: authorizedUser.id,
            },
            expectedDiscussion: {
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

          const params: UpdateDiscussionStatusParams = {
            discussionId: discussionWithoutUserEmail.id,
            status: "REJECTED",
            rejectionKind: "NO_TIME",
          };

          await updateDiscussionStatus.execute(params, authorizedUser);

          const { htmlContent, subject } = makeExpectedEmailParams(
            "l’entreprise traverse une période chargée et n’a pas le temps d’accueillir une immersion.",
            discussionWithoutUserEmail.establishmentContact.firstName,
            discussionWithoutUserEmail.establishmentContact.lastName,
          );

          expectDiscussionInRepoAndInOutbox({
            triggeredBy: {
              kind: "inclusion-connected",
              userId: authorizedUser.id,
            },
            expectedDiscussion: {
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
          });
        });
      });
    });
  });

  const expectDiscussionInRepoAndInOutbox = ({
    expectedDiscussion,
    triggeredBy,
    skipSendingEmail,
  }: {
    expectedDiscussion: DiscussionDto;
    triggeredBy: TriggeredBy;
    skipSendingEmail?: boolean;
  }) => {
    expectToEqual(uow.discussionRepository.discussions, [expectedDiscussion]);

    expectArraysToMatch(uow.outboxRepository.events, [
      {
        topic: "DiscussionStatusManuallyUpdated",
        payload: {
          discussion: expectedDiscussion,
          triggeredBy,
          ...(skipSendingEmail !== undefined ? { skipSendingEmail } : {}),
        },
      },
    ]);
  };
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
