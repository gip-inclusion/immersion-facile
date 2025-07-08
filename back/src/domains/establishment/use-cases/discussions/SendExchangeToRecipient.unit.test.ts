import { addHours } from "date-fns";
import {
  DiscussionBuilder,
  type Exchange,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  immersionFacileNoReplyEmailSender,
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
import { SendExchangeToRecipient } from "./SendExchangeToRecipient";

const domain = "my-domain.com";

describe("SendExchangeToRecipient", () => {
  let useCase: SendExchangeToRecipient;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: CustomTimeGateway;
  let notificationGateway: InMemoryNotificationGateway;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    timeGateway = new CustomTimeGateway();
    notificationGateway = new InMemoryNotificationGateway();
    useCase = new SendExchangeToRecipient(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
      domain,
      notificationGateway,
    );
  });

  describe("right paths", () => {
    const base64RawContent = Buffer.from("my-attachment-content").toString(
      "base64",
    );
    const link = "pdf";
    const notABlobLink = "notABlobLink";

    beforeEach(() => {
      notificationGateway.attachmentsByLinks = {
        [link]: base64RawContent,
        [notABlobLink]: "not-a-blob",
      };
    });

    it("skips the use case, if the skip parameter is provided", async () => {
      const discussion = new DiscussionBuilder().build();
      uow.discussionRepository.discussions = [discussion];

      await useCase.execute({
        skipSendingEmail: true,
        discussionId: discussion.id,
      });

      expectSavedNotificationsAndEvents({
        emails: [],
        sms: [],
      });
    });

    it("sends the email to the right recipient (response from establishment to potential beneficiary)", async () => {
      const lastExchange: Exchange = {
        sender: "establishment",
        recipient: "potentialBeneficiary",
        sentAt: "2023-06-28T08:06:52.000Z",
        message: "message",
        subject: "subject",
        attachments: [{ link, name: "Piece jointe.pdf" }],
      };
      const discussion = new DiscussionBuilder()
        .withAppellationCode("20567")
        .withId(uuid())
        .withExchanges([
          {
            subject: "My subject - discussion 1",
            message: "Hello",
            sender: "potentialBeneficiary",
            sentAt: addHours(timeGateway.now(), -2).toISOString(),
            recipient: "establishment",
            attachments: [],
          },
          lastExchange,
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
            ${lastExchange.message}`,
              subject: lastExchange.subject,
            },
            recipients: [discussion.potentialBeneficiary.email],
            replyTo: {
              email: `${discussion.establishmentContact.firstName}_${discussion.establishmentContact.lastName}__${discussion.id}_e@reply.my-domain.com`,
              name: `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`,
            },
            sender: immersionFacileNoReplyEmailSender,
            cc: [],
            attachments: [
              {
                name: lastExchange.attachments[0].name,
                content: base64RawContent,
              },
            ],
          },
        ],
      });
    });

    it("sends the email with a default message if not provided", async () => {
      const lastExchange: Exchange = {
        sender: "establishment",
        recipient: "potentialBeneficiary",
        sentAt: "2023-06-28T08:06:52.000Z",
        message: "",
        subject: "subject",
        attachments: [{ link, name: "Piece jointe.pdf" }],
      };
      const discussion = new DiscussionBuilder()
        .withAppellationCode("20567")
        .withId(uuid())
        .withExchanges([
          {
            subject: "My subject - discussion 1",
            message: "Hello",
            sender: "potentialBeneficiary",
            sentAt: addHours(timeGateway.now(), -2).toISOString(),
            recipient: "establishment",
            attachments: [],
          },
          lastExchange,
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
            ${"--- pas de message ---"}`,
              subject: lastExchange.subject,
            },
            recipients: [discussion.potentialBeneficiary.email],
            replyTo: {
              email: `${discussion.establishmentContact.firstName}_${discussion.establishmentContact.lastName}__${discussion.id}_e@reply.my-domain.com`,
              name: `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`,
            },
            sender: immersionFacileNoReplyEmailSender,
            cc: [],
            attachments: [
              {
                name: lastExchange.attachments[0].name,
                content: base64RawContent,
              },
            ],
          },
        ],
      });
    });

    it("sends the email to the right recipient without attachment", async () => {
      const lastExchange: Exchange = {
        sender: "establishment",
        recipient: "potentialBeneficiary",
        sentAt: "2023-06-28T08:06:52.000Z",
        message: "message",
        subject: "subject",
        attachments: [{ link: notABlobLink, name: "VCard" }],
      };
      const discussion = new DiscussionBuilder()
        .withAppellationCode("20567")
        .withId(uuid())
        .withExchanges([
          {
            subject: "My subject - discussion 1",
            message: "Hello",
            sender: "potentialBeneficiary",
            sentAt: addHours(timeGateway.now(), -2).toISOString(),
            recipient: "establishment",
            attachments: [],
          },
          lastExchange,
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
            ${lastExchange.message}`,
              subject: lastExchange.subject,
            },
            recipients: [discussion.potentialBeneficiary.email],
            replyTo: {
              email: `${discussion.establishmentContact.firstName}_${discussion.establishmentContact.lastName}__${discussion.id}_e@reply.my-domain.com`,
              name: `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`,
            },
            sender: immersionFacileNoReplyEmailSender,
            cc: [],
            attachments: [],
          },
        ],
      });
    });

    it("sends email even if firstname or lastname has special caracters usually not supported in emails", async () => {
      const lastExchange: Exchange = {
        subject: "My subject - discussion 1",
        message: "My response",
        sender: "potentialBeneficiary",
        sentAt: new Date().toISOString(),
        recipient: "establishment",
        attachments: [],
      };

      const discussion = new DiscussionBuilder()
        .withAppellationCode("20567")
        .withPotentialBeneficiaryFirstname("É ric")
        .withPotentialBeneficiaryLastName("el Ah&é$truc")
        .withId(uuid())
        .withExchanges([
          {
            subject: "My subject - discussion 1",
            message: "Hello",
            sender: "potentialBeneficiary",
            sentAt: addHours(timeGateway.now(), -2).toISOString(),
            recipient: "establishment",
            attachments: [],
          },
          {
            sender: "establishment",
            recipient: "potentialBeneficiary",
            sentAt: "2023-06-28T08:06:52.000Z",
            message: "message",
            subject: "subject",
            attachments: [{ link: notABlobLink, name: "VCard" }],
          },
          {
            subject: "My subject - discussion 1",
            message: "My response",
            sender: "potentialBeneficiary",
            sentAt: new Date().toISOString(),
            recipient: "establishment",
            attachments: [],
          },
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
              subject: lastExchange.subject,
            },
            recipients: [discussion.establishmentContact.email],
            replyTo: {
              email: `e-ric_el-ah-e-tru__${discussion.id}_b@reply.my-domain.com`,
              name: `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
            },
            sender: immersionFacileNoReplyEmailSender,
            cc: discussion.establishmentContact.copyEmails,
            attachments: [],
          },
        ],
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
      const discussion = new DiscussionBuilder()
        .withAppellationCode("20567")
        .withId(uuid())
        .build();

      uow.discussionRepository.discussions = [discussion];
      uow.romeRepository.appellations = [];

      await expectPromiseToFailWithError(
        useCase.execute({ discussionId: discussion.id }),
        errors.discussion.missingAppellationLabel({
          appellationCode: discussion.appellationCode,
        }),
      );
    });

    it("throws an error if discussion does not have exchanges", async () => {
      const discussion = new DiscussionBuilder()
        .withAppellationCode("20567")
        .withId(uuid())
        .withExchanges([])
        .build();

      uow.discussionRepository.discussions = [discussion];

      await expectPromiseToFailWithError(
        useCase.execute({ discussionId: discussion.id }),
        new Error(`No exchanges on discussion '${discussion.id}'.`),
      );
    });
  });
});
