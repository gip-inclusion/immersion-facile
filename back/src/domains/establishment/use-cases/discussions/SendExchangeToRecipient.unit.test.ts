import { addHours } from "date-fns";
import {
  DiscussionBuilder,
  Exchange,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { InMemoryNotificationGateway } from "../../../core/notifications/adapters/InMemoryNotificationGateway";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
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
    const bufferRawContent = Buffer.from("my-attachment-content");
    const link = "pdf";

    beforeEach(() => {
      notificationGateway.attachmentsByLinks = { [link]: bufferRawContent };
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
              email: `${discussion.id}_e@reply.my-domain.com`,
              name: `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`,
            },
            sender: immersionFacileNoReplyEmailSender,
            cc: [],
            attachments: [
              {
                name: lastExchange.attachments[0].name,
                content: bufferRawContent.toString("base64"),
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
              email: `${discussion.id}_e@reply.my-domain.com`,
              name: `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`,
            },
            sender: immersionFacileNoReplyEmailSender,
            cc: [],
            attachments: [
              {
                name: lastExchange.attachments[0].name,
                content: bufferRawContent.toString("base64"),
              },
            ],
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

    it("throws an error if appelation code does not exist", async () => {
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
