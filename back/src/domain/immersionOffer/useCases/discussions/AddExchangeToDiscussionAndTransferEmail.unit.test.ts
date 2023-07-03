import { expectPromiseToFailWithError, expectToEqual } from "shared";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../_testBuilders/makeExpectSavedNotificationsAndEvents";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  NotFoundError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryDiscussionAggregateRepository } from "../../../../adapters/secondary/immersionOffer/InMemoryDiscussionAggregateRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { DiscussionAggregate } from "../../entities/DiscussionAggregate";
import {
  AddExchangeToDiscussionAndTransferEmail,
  BrevoInboundBody,
} from "./AddExchangeToDiscussionAndTransferEmail";

describe("AddExchangeToDiscussionAndTransferEmail", () => {
  let discussionAggregateRepository: InMemoryDiscussionAggregateRepository;
  let addExchangeToDiscussionAndTransferEmail: AddExchangeToDiscussionAndTransferEmail;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    const uow = createInMemoryUow();
    discussionAggregateRepository = uow.discussionAggregateRepository;
    const uowPerformer = new InMemoryUowPerformer(uow);

    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    const uuidGenerator = new UuidV4Generator();
    timeGateway = new CustomTimeGateway();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );

    addExchangeToDiscussionAndTransferEmail =
      new AddExchangeToDiscussionAndTransferEmail(
        uowPerformer,
        saveNotificationAndRelatedEvent,
        "my-domain.com",
      );
  });

  describe("right paths", () => {
    it("saves the new exchange in the discussion and sends the email to the right recipient (response from establishment to potential beneficiary)", async () => {
      const discussionId1 = "my-discussion-id-1";
      const discussionId2 = "my-discussion-id-2";
      const brevoResponse = createBrevoResponse([
        `${discussionId1}_b@reply-dev.immersion-facile.beta.gouv.fr`,
        `${discussionId2}_e@reply.immersion-facile.beta.gouv.fr`,
      ]);
      const discussion1: DiscussionAggregate = {
        id: discussionId1,
        exchanges: [
          {
            subject: "My subject",
            message: "Hello",
            sender: "potentialBeneficiary",
            sentAt: new Date(),
            recipient: "establishment",
          },
        ],
        createdAt: new Date(),
        appellationCode: "19540",
        address: {
          city: "Paris",
          departmentCode: "75",
          postcode: "75001",
          streetNumberAndAddress: "12 Rue de la Paix",
        },
        establishmentContact: {
          copyEmails: [],
          contactMode: "EMAIL",
          email: "establishment-discussion-1@immersion-facile.beta.gouv.fr",
          firstName: "Roger",
          lastName: "Rabbit",
          phone: "0123456789",
          job: "Directeur",
        },
        immersionObjective: "Confirmer un projet professionnel",
        potentialBeneficiary: {
          email: "potential-benef-discussion-1@immersion-facile.beta.gouv.fr",
          firstName: "Baby",
          lastName: "Herman",
          phone: "0123456754",
          resumeLink: "http://fakelink.com",
        },
        siret: "01234567891011",
        businessName: "France Merguez Distribution",
      };
      const discussion2: DiscussionAggregate = {
        id: discussionId2,
        exchanges: [
          {
            subject: "My subject",
            message: "Hello",
            sender: "potentialBeneficiary",
            sentAt: new Date(),
            recipient: "establishment",
          },
        ],
        createdAt: new Date(),
        appellationCode: "19540",
        address: {
          city: "Paris",
          departmentCode: "75",
          postcode: "75001",
          streetNumberAndAddress: "12 Rue de la Paix",
        },
        establishmentContact: {
          copyEmails: [
            "copy1@gmail.com",
            "copy2_e@dev.immersion-facile.beta.gouv.fr",
          ],
          contactMode: "EMAIL",
          email: "establishment-discussion-2@immersion-facile.beta.gouv.fr",
          firstName: "Roger",
          lastName: "Rabbit",
          phone: "0123456789",
          job: "Directeur",
        },
        immersionObjective: "Confirmer un projet professionnel",
        potentialBeneficiary: {
          email: "potential-benef-discussion-2@immersion-facile.beta.gouv.fr",
          firstName: "Baby",
          lastName: "Herman",
          phone: "0123456754",
          resumeLink: "http://fakelink.com",
        },
        siret: "01234567891011",
        businessName: "France Merguez Distribution",
      };

      discussionAggregateRepository.discussionAggregates = [
        discussion1,
        discussion2,
      ];
      await addExchangeToDiscussionAndTransferEmail.execute(brevoResponse);
      const discussionsInRepository =
        discussionAggregateRepository.discussionAggregates;

      expect(discussionsInRepository).toHaveLength(2);

      expectToEqual(discussionsInRepository[0].exchanges, [
        ...discussion1.exchanges,
        {
          message: brevoResponse.items[0].RawHtmlBody,
          sender: "establishment",
          sentAt: new Date("2023-06-28T08:06:52.000Z"),
          recipient: "potentialBeneficiary",
          subject: brevoResponse.items[0].Subject,
        },
      ]);

      expectToEqual(discussionsInRepository[1].exchanges, [
        ...discussion1.exchanges,
        {
          message: brevoResponse.items[1].RawHtmlBody,
          recipient: "establishment",
          sentAt: new Date("2023-06-28T08:06:52.000Z"),
          sender: "potentialBeneficiary",
          subject: brevoResponse.items[1].Subject,
        },
      ]);

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "DISCUSSION_EXCHANGE",
            params: {
              htmlContent:
                brevoResponse.items[0].RawHtmlBody ?? "--- pas de message ---",
              subject: brevoResponse.items[0].Subject,
            },
            recipients: [discussion1.potentialBeneficiary.email],
            replyTo: {
              email: `${discussionId1}_e@reply.my-domain.com`,
              name: `${discussion1.establishmentContact.firstName} ${discussion1.establishmentContact.lastName} - ${discussion1.businessName}`,
            },
            cc: [],
          },
          {
            kind: "DISCUSSION_EXCHANGE",
            params: {
              htmlContent:
                brevoResponse.items[1].RawHtmlBody ?? "--- pas de message ---",
              subject: brevoResponse.items[1].Subject,
            },
            recipients: [discussion2.establishmentContact.email],
            replyTo: {
              email: `${discussionId2}_b@reply.my-domain.com`,
              name: `${discussion2.potentialBeneficiary.firstName} ${discussion2.potentialBeneficiary.lastName}`,
            },
            cc: discussion2.establishmentContact.copyEmails,
          },
        ],
      });
    });
  });
  describe("wrong paths", () => {
    it("throws an error if the email does not have the right format", async () => {
      await expectPromiseToFailWithError(
        addExchangeToDiscussionAndTransferEmail.execute(
          createBrevoResponse([
            "gerard@reply-dev.immersion-facile.beta.gouv.fr",
          ]),
        ),
        new BadRequestError(
          `Email does not have the right format email to : gerard@reply-dev.immersion-facile.beta.gouv.fr`,
        ),
      );
    });

    it("throws an error if the email does not have the right recipient kind", async () => {
      await expectPromiseToFailWithError(
        addExchangeToDiscussionAndTransferEmail.execute(
          createBrevoResponse([
            "iozeuroiu897654654_bob@reply-dev.immersion-facile.beta.gouv.fr",
          ]),
        ),
        new BadRequestError(`Email does not have the right format kind : bob`),
      );
    });

    it("throws an error if the discussion does not exist", async () => {
      const discussionId = "my-discussion-id";
      const brevoResponse = createBrevoResponse([
        `${discussionId}_e@reply-dev.immersion-facile.beta.gouv.fr`,
      ]);
      await expectPromiseToFailWithError(
        addExchangeToDiscussionAndTransferEmail.execute(brevoResponse),
        new NotFoundError(`Discussion ${discussionId} not found`),
      );
    });
  });
});

const createBrevoResponse = (toAddresses: string[]): BrevoInboundBody => ({
  items: toAddresses.map((address) => ({
    Uuid: ["8d79f2b1-20ae-4939-8d0b-d2517331a9e5"],
    MessageId:
      "<CADYedJsX7_KwtMJem4m-Dhwqp5fmBiqrdMzzDBu-7nbfAuY=ew@mail.gmail.com>",
    InReplyTo:
      "<CADYedJsS=ZXd8RPDjNuD7GhOwCgvaLwvAS=2kU3N+sd5wgu6Ag@mail.gmail.com>",
    From: {
      Name: "Enguerran Weiss",
      Address: "enguerranweiss@gmail.com",
    },
    To: [
      {
        Name: null,
        Address: address,
      },
    ],
    Cc: [
      {
        Name: null,
        Address: "gerard2@reply-dev.immersion-facile.beta.gouv.fr",
      },
      {
        Name: null,
        Address: "gerard-cc@reply-dev.imersion-facile.beta.gouv.fr",
      },
    ],
    ReplyTo: null,
    SentAtDate: "Wed, 28 Jun 2023 10:06:52 +0200",
    Subject: "Fwd: Hey !",
    Attachments: [
      {
        Name: "IMG_20230617_151239.jpg",
        ContentType: "image/jpeg",
        ContentLength: 1652571,
        ContentID: "ii_ljff7lfo0",
        DownloadToken:
          "eyJmb2xkZXIiOiIyMDIzMDYyODA4MDcwNy41Ni4xNTQxNDI5NTQwIiwiZmlsZW5hbWUiOiJJTUdfMjAyMzA2MTdfMTUxMjM5LmpwZyJ9",
      },
    ],

    RawHtmlBody:
      '<div dir="ltr"><br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>De : <b class="gmail_sendername" dir="auto">Enguerran Weiss</b> <span dir="auto">&lt;<a href="mailto:enguerranweiss@gmail.com">enguerranweiss@gmail.com</a>&gt;</span><br>Date: mer. 28 juin 2023 à 09:57<br>Subject: Fwd: Hey !<br>To: &lt;<a href="mailto:tristan@reply-dev.immersion-facile.beta.gouv.fr">tristan@reply-dev.immersion-facile.beta.gouv.fr</a>&gt;<br></div><br><br><div dir="ltr"><br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>De : <b class="gmail_sendername" dir="auto">Enguerran Weiss</b> <span dir="auto">&lt;<a href="mailto:enguerranweiss@gmail.com" target="_blank">enguerranweiss@gmail.com</a>&gt;</span><br>Date: mer. 28 juin 2023 à 09:55<br>Subject: Hey !<br>To: &lt;<a href="mailto:roger@reply-dev.immersion-facile.gouv.fr" target="_blank">roger@reply-dev.immersion-facile.gouv.fr</a>&gt;<br></div><br><br><div dir="ltr"><div><br clear="all"></div><div>Comment ça va ?</div><div><br></div><div><img src="cid:ii_ljff7lfo0" alt="IMG_20230617_151239.jpg" style="margin-right:0px" width="223" height="167"></div><div><br></div><div><br></div><div>A + !<br></div><div><br></div><div><span class="gmail_signature_prefix">-- </span><br><div dir="ltr" class="gmail_signature" data-smartmail="gmail_signature"><div dir="ltr"><div><div dir="ltr"><span style="color:rgb(0,0,0);font-family:Times;font-size:medium"><img src="http://goodies.enguerranweiss.fr/id/sign_html-v2-bl.png"></span><p style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:rgb(102,102,102)"></p><p style="font-family:Georgia,serif;font-size:11px;color:rgb(102,102,102)">+33(0)6 10 13 76 84 <br><a href="mailto:hello@enguerranweiss.fr" target="_blank">hello@enguerranweiss.fr</a><br><a href="http://www.enguerranweiss.fr" target="_blank">http://www.enguerranweiss.fr</a></p></div></div></div></div></div></div>\r\n</div><br clear="all"><br><span class="gmail_signature_prefix">-- </span><br><div dir="ltr" class="gmail_signature" data-smartmail="gmail_signature"><div dir="ltr"><div><div dir="ltr"><span style="color:rgb(0,0,0);font-family:Times;font-size:medium"><img src="http://goodies.enguerranweiss.fr/id/sign_html-v2-bl.png"></span><p style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:rgb(102,102,102)"></p><p style="font-family:Georgia,serif;font-size:11px;color:rgb(102,102,102)">+33(0)6 10 13 76 84 <br><a href="mailto:hello@enguerranweiss.fr" target="_blank">hello@enguerranweiss.fr</a><br><a href="http://www.enguerranweiss.fr" target="_blank">http://www.enguerranweiss.fr</a></p></div></div></div></div></div>\r\n</div><br clear="all"><br><span class="gmail_signature_prefix">-- </span><br><div dir="ltr" class="gmail_signature" data-smartmail="gmail_signature"><div dir="ltr"><div><div dir="ltr"><span style="color:rgb(0,0,0);font-family:Times;font-size:medium"><img src="http://goodies.enguerranweiss.fr/id/sign_html-v2-bl.png"></span><p style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:rgb(102,102,102)"></p><p style="font-family:Georgia,serif;font-size:11px;color:rgb(102,102,102)">+33(0)6 10 13 76 84 <br><a href="mailto:hello@enguerranweiss.fr" target="_blank">hello@enguerranweiss.fr</a><br><a href="http://www.enguerranweiss.fr" target="_blank">http://www.enguerranweiss.fr</a></p></div></div></div></div></div>\r\n',
    RawTextBody:
      "---------- Forwarded message ---------\r\nDe : Enguerran Weiss <enguerranweiss@gmail.com>\r\nDate: mer. 28 juin 2023 à 09:57\r\nSubject: Fwd: Hey !\r\nTo: <tristan@reply-dev.immersion-facile.beta.gouv.fr>\r\n\n\n\n\n---------- Forwarded message ---------\r\nDe : Enguerran Weiss <enguerranweiss@gmail.com>\r\nDate: mer. 28 juin 2023 à 09:55\r\nSubject: Hey !\r\nTo: <roger@reply-dev.immersion-facile.gouv.fr>\r\n\n\n\nComment ça va ?\r\n\n[image: IMG_20230617_151239.jpg]\r\n\n\nA + !\r\n\n-- \r\n\n+33(0)6 10 13 76 84\r\nhello@enguerranweiss.fr\r\nhttp://www.enguerranweiss.fr\r\n\n\n-- \r\n\n+33(0)6 10 13 76 84\r\nhello@enguerranweiss.fr\r\nhttp://www.enguerranweiss.fr\r\n\n\n-- \r\n\n+33(0)6 10 13 76 84\r\nhello@enguerranweiss.fr\r\nhttp://www.enguerranweiss.fr\r\n",
  })),
});
