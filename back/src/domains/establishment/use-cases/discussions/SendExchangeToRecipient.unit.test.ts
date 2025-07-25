import { addHours, addMinutes } from "date-fns";
import {
  type Attachment,
  ConnectedUserBuilder,
  DiscussionBuilder,
  type EstablishmentExchange,
  type Exchange,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  immersionFacileNoReplyEmailSender,
  type PotentialBeneficiaryExchange,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { InMemoryNotificationGateway } from "../../../core/notifications/adapters/InMemoryNotificationGateway";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import type { EstablishmentUserRight } from "../../entities/EstablishmentAggregate";
import { EstablishmentAggregateBuilder } from "../../helpers/EstablishmentBuilders";
import { SendExchangeToRecipient } from "./SendExchangeToRecipient";

describe("SendExchangeToRecipient", () => {
  const now = new Date();
  const base64RawContent = Buffer.from("my-attachment-content").toString(
    "base64",
  );
  const link = "pdf";
  const notABlobLink = "notABlobLink";

  const admin = new ConnectedUserBuilder()
    .withId(uuid())
    .withFirstName("Ali")
    .withLastName("Baba")
    .withEmail("ali.baba@establishment.com")
    .buildUser();
  const contact = new ConnectedUserBuilder()
    .withId(uuid())
    .withFirstName("Billy")
    .withLastName("Idol")
    .withEmail("billy.idol@establishment.com")
    .buildUser();

  const notifiedEstablishmentRights: EstablishmentUserRight[] = [
    {
      role: "establishment-admin",
      userId: admin.id,
      job: "",
      phone: "",
      shouldReceiveDiscussionNotifications: true,
      isMainContactByPhone: false,
    },
    {
      role: "establishment-contact",
      userId: contact.id,
      shouldReceiveDiscussionNotifications: true,
    },
  ];

  const establishment = new EstablishmentAggregateBuilder()
    .withUserRights(notifiedEstablishmentRights)
    .build();

  const discussionWithSiretAndAppellation = new DiscussionBuilder()
    .withSiret(establishment.establishment.siret)
    .withAppellationCode("20567")
    .withExchanges([])
    .build();

  const firstBeneficiaryExchange: Exchange = {
    subject: "My subject - discussion 1",
    message: "Hello",
    sender: "potentialBeneficiary",
    sentAt: addHours(now, -2).toISOString(),
    attachments: [],
  };

  const lastBeneficiaryExchange: Exchange = {
    subject: "My subject - discussion 1",
    message: "My response",
    sender: "potentialBeneficiary",
    sentAt: addMinutes(now, -30).toISOString(),
    attachments: [],
  };

  const makeLastEstablishmentExchange = (
    message: string,
    attachments: Attachment[],
  ): EstablishmentExchange => ({
    sender: "establishment",
    firstname: admin.firstName,
    lastname: admin.lastName,
    email: admin.email,
    sentAt: addHours(now, -1).toISOString(),
    message,
    subject: "subject",
    attachments,
  });

  let useCase: SendExchangeToRecipient;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: CustomTimeGateway;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    const notificationGateway = new InMemoryNotificationGateway();
    timeGateway = new CustomTimeGateway(now);

    useCase = new SendExchangeToRecipient(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
      "my-domain.com",
      notificationGateway,
    );

    notificationGateway.attachmentsByLinks = {
      [link]: base64RawContent,
      [notABlobLink]: "not-a-blob",
    };
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];
    uow.userRepository.users = [admin, contact];
  });

  describe("right paths", () => {
    describe("sends the email to the right recipient", () => {
      it("when last exchange is from establishment, the exchange is sent to the potential beneficiary", async () => {
        const lastEstablishmentExchange = makeLastEstablishmentExchange(
          "message",
          [{ link, name: "Piece jointe.pdf" }],
        );
        const discussion = new DiscussionBuilder(
          discussionWithSiretAndAppellation,
        )
          .withExchanges([firstBeneficiaryExchange, lastEstablishmentExchange])
          .build();

        uow.discussionRepository.discussions = [discussion];

        await useCase.execute({
          discussionId: discussion.id,
        });

        expectToEqual(uow.discussionRepository.discussions, [discussion]);

        expectSavedNotificationsAndEvents({
          emails: [
            {
              kind: "DISCUSSION_EXCHANGE",
              params: {
                htmlContent: `<div style="color: #b5b5b5; font-size: 12px">Pour rappel, voici les informations liées à cette mise en relation :
                  <br /><ul>
                  <li>Candidat : ali baba</li>
                  <li>Métier : Vendeur / Vendeuse en chocolaterie</li>
                  <li>Entreprise : My default business name - 1 rue de la Paix 75001 Paris</li>
                  </ul><br /></div>
            ${lastEstablishmentExchange.message}`,
                subject: lastEstablishmentExchange.subject,
              },
              recipients: [discussion.potentialBeneficiary.email],
              replyTo: {
                email: `${lastEstablishmentExchange.firstname.toLocaleLowerCase()}_${lastEstablishmentExchange.lastname.toLocaleLowerCase()}__${discussion.id}_e@reply.my-domain.com`,
                name: `${lastEstablishmentExchange.firstname} ${lastEstablishmentExchange.lastname} - ${discussion.businessName}`,
              },
              sender: immersionFacileNoReplyEmailSender,
              attachments: [
                {
                  name: lastEstablishmentExchange.attachments[0].name,
                  content: base64RawContent,
                },
              ],
            },
          ],
        });
      });

      it("when last exchange is from potential beneficiary, the exchange is sent to establishment users that have enabled notifications", async () => {
        uow.establishmentAggregateRepository.establishmentAggregates = [
          new EstablishmentAggregateBuilder(establishment)
            .withUserRights([
              ...notifiedEstablishmentRights,
              {
                role: "establishment-admin",
                userId: "otherUser1",
                shouldReceiveDiscussionNotifications: false,
                job: "",
                phone: "",
                isMainContactByPhone: false,
              },
              {
                role: "establishment-contact",
                userId: "otherUser2",
                shouldReceiveDiscussionNotifications: false,
              },
            ])
            .build(),
        ];

        const lastBeneficiaryExchange: PotentialBeneficiaryExchange = {
          sender: "potentialBeneficiary",
          attachments: [{ link, name: "La maitresse de Chacakan.pdf" }],
          message: "Coucou!",
          sentAt: addMinutes(now, -30).toISOString(),
          subject: "C'est mon truc",
        };

        const discussion = new DiscussionBuilder(
          discussionWithSiretAndAppellation,
        )
          .withExchanges([
            firstBeneficiaryExchange,
            makeLastEstablishmentExchange("message", [
              { link, name: "Piece jointe.pdf" },
            ]),
            lastBeneficiaryExchange,
          ])
          .build();

        uow.discussionRepository.discussions = [discussion];

        await useCase.execute({
          discussionId: discussion.id,
        });

        expectToEqual(uow.discussionRepository.discussions, [discussion]);

        expectSavedNotificationsAndEvents({
          emails: [
            {
              kind: "DISCUSSION_EXCHANGE",
              params: {
                htmlContent: `<div style="color: #b5b5b5; font-size: 12px">Pour rappel, voici les informations liées à cette mise en relation :
                  <br /><ul>
                  <li>Candidat : ali baba</li>
                  <li>Métier : Vendeur / Vendeuse en chocolaterie</li>
                  <li>Entreprise : My default business name - 1 rue de la Paix 75001 Paris</li>
                  </ul><br /></div>
            ${lastBeneficiaryExchange.message}`,
                subject: lastBeneficiaryExchange.subject,
              },
              recipients: [admin.email, contact.email],
              replyTo: {
                email: `${discussion.potentialBeneficiary.firstName}_${discussion.potentialBeneficiary.lastName}__${discussion.id}_b@reply.my-domain.com`,
                name: `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
              },
              sender: immersionFacileNoReplyEmailSender,
              attachments: [
                {
                  name: lastBeneficiaryExchange.attachments[0].name,
                  content: base64RawContent,
                },
              ],
            },
          ],
        });
      });
    });

    describe("Specific scenarios", () => {
      it("skips the use case, if the skip parameter is provided", async () => {
        uow.discussionRepository.discussions = [
          discussionWithSiretAndAppellation,
        ];

        await useCase.execute({
          skipSendingEmail: true,
          discussionId: discussionWithSiretAndAppellation.id,
        });

        expectSavedNotificationsAndEvents({
          emails: [],
          sms: [],
        });
      });

      it("sends the email with a default message if not provided", async () => {
        const lastEstablishmentExchange = makeLastEstablishmentExchange("", [
          { link, name: "Piece jointe.pdf" },
        ]);
        const discussion = new DiscussionBuilder(
          discussionWithSiretAndAppellation,
        )
          .withExchanges([firstBeneficiaryExchange, lastEstablishmentExchange])
          .build();

        uow.discussionRepository.discussions = [discussion];

        await useCase.execute({
          discussionId: discussion.id,
        });

        expectToEqual(uow.discussionRepository.discussions, [discussion]);

        expectSavedNotificationsAndEvents({
          emails: [
            {
              kind: "DISCUSSION_EXCHANGE",
              params: {
                htmlContent: `<div style="color: #b5b5b5; font-size: 12px">Pour rappel, voici les informations liées à cette mise en relation :
                  <br /><ul>
                  <li>Candidat : ali baba</li>
                  <li>Métier : Vendeur / Vendeuse en chocolaterie</li>
                  <li>Entreprise : My default business name - 1 rue de la Paix 75001 Paris</li>
                  </ul><br /></div>
            ${"--- pas de message ---"}`,
                subject: lastEstablishmentExchange.subject,
              },
              recipients: [discussion.potentialBeneficiary.email],
              replyTo: {
                email: `${lastEstablishmentExchange.firstname.toLocaleLowerCase()}_${lastEstablishmentExchange.lastname.toLocaleLowerCase()}__${discussion.id}_e@reply.my-domain.com`,
                name: `${lastEstablishmentExchange.firstname} ${lastEstablishmentExchange.lastname} - ${discussion.businessName}`,
              },
              sender: immersionFacileNoReplyEmailSender,
              attachments: [
                {
                  name: lastEstablishmentExchange.attachments[0].name,
                  content: base64RawContent,
                },
              ],
            },
          ],
        });
      });

      it("sends the email to the right recipient without attachment when last exchange attachment is not a blob link", async () => {
        const lastExchange: Exchange = makeLastEstablishmentExchange(
          "message",
          [{ link: notABlobLink, name: "VCard" }],
        );

        const discussion = new DiscussionBuilder(
          discussionWithSiretAndAppellation,
        )
          .withExchanges([firstBeneficiaryExchange, lastExchange])
          .build();

        uow.discussionRepository.discussions = [discussion];

        await useCase.execute({
          discussionId: discussion.id,
        });

        expectToEqual(uow.discussionRepository.discussions, [discussion]);

        expectSavedNotificationsAndEvents({
          emails: [
            {
              kind: "DISCUSSION_EXCHANGE",
              params: {
                htmlContent: `<div style="color: #b5b5b5; font-size: 12px">Pour rappel, voici les informations liées à cette mise en relation :
                  <br /><ul>
                  <li>Candidat : ali baba</li>
                  <li>Métier : Vendeur / Vendeuse en chocolaterie</li>
                  <li>Entreprise : My default business name - 1 rue de la Paix 75001 Paris</li>
                  </ul><br /></div>
            ${lastExchange.message}`,
                subject: lastExchange.subject,
              },
              recipients: [discussion.potentialBeneficiary.email],
              replyTo: {
                email: `${lastExchange.firstname.toLocaleLowerCase()}_${lastExchange.lastname.toLocaleLowerCase()}__${discussion.id}_e@reply.my-domain.com`,
                name: `${lastExchange.firstname} ${lastExchange.lastname} - ${discussion.businessName}`,
              },
              sender: immersionFacileNoReplyEmailSender,
              attachments: [],
            },
          ],
        });
      });

      it("sends email even if firstname or lastname has special caracters usually not supported in emails", async () => {
        const discussion = new DiscussionBuilder(
          discussionWithSiretAndAppellation,
        )
          .withPotentialBeneficiaryFirstname("É ric")
          .withPotentialBeneficiaryLastName("el Ah&é$truc")
          .withExchanges([
            firstBeneficiaryExchange,
            makeLastEstablishmentExchange("message", [
              { link: notABlobLink, name: "VCard" },
            ]),
            lastBeneficiaryExchange,
          ])
          .build();

        uow.discussionRepository.discussions = [discussion];

        await useCase.execute({
          discussionId: discussion.id,
        });

        expectSavedNotificationsAndEvents({
          emails: [
            {
              kind: "DISCUSSION_EXCHANGE",
              params: {
                htmlContent: expect.any(String),
                subject: lastBeneficiaryExchange.subject,
              },
              recipients: [admin.email, contact.email],
              replyTo: {
                email: `e-ric_el-ah-e-tru__${discussion.id}_b@reply.my-domain.com`,
                name: `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
              },
              sender: immersionFacileNoReplyEmailSender,
              attachments: [],
            },
          ],
        });
      });
    });
  });

  describe("wrong paths", () => {
    it("throws an error if the discussion does not exist", async () => {
      const discussionId = uuid();

      await expectPromiseToFailWithError(
        useCase.execute({ discussionId }),
        errors.discussion.notFound({ discussionId }),
      );
    });

    it("throws an error if appellation code does not exist", async () => {
      const discussion = new DiscussionBuilder(
        discussionWithSiretAndAppellation,
      )
        .withAppellationCode("20567")
        .withExchanges([firstBeneficiaryExchange])
        .build();

      uow.discussionRepository.discussions = [discussion];
      uow.romeRepository.appellations = [];

      await expectPromiseToFailWithError(
        useCase.execute({ discussionId: discussion.id }),
        errors.rome.missingAppellation({
          appellationCode: discussion.appellationCode,
        }),
      );
    });

    it("throws an error if discussion does not have exchanges", async () => {
      uow.discussionRepository.discussions = [
        discussionWithSiretAndAppellation,
      ];

      await expectPromiseToFailWithError(
        useCase.execute({ discussionId: discussionWithSiretAndAppellation.id }),
        errors.discussion.noExchanges(discussionWithSiretAndAppellation.id),
      );
    });

    describe("when last exchange is from potentialBeneficiary", () => {
      const discussionWithEstablishmentLastExchange = new DiscussionBuilder(
        discussionWithSiretAndAppellation,
      )
        .withExchanges([
          firstBeneficiaryExchange,
          makeLastEstablishmentExchange("", []),
          lastBeneficiaryExchange,
        ])
        .build();

      beforeEach(() => {
        uow.discussionRepository.discussions = [
          discussionWithEstablishmentLastExchange,
        ];
      });

      it("throws an error if missing establisment", async () => {
        uow.establishmentAggregateRepository.establishmentAggregates = [];

        await expectPromiseToFailWithError(
          useCase.execute({
            discussionId: discussionWithSiretAndAppellation.id,
          }),
          errors.establishment.notFound({
            siret: discussionWithEstablishmentLastExchange.siret,
          }),
        );
      });

      it("throws an error if missing user", async () => {
        uow.userRepository.users = [];

        await expectPromiseToFailWithError(
          useCase.execute({
            discussionId: discussionWithEstablishmentLastExchange.id,
          }),
          errors.users.notFound({
            userIds: [admin.id, contact.id],
          }),
        );
      });
    });
  });
});
