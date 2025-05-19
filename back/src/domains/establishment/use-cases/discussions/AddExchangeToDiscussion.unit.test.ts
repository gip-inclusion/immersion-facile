import {
  type BrevoInboundBody,
  DiscussionBuilder,
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { ZodError } from "zod";
import { makeCreateNewEvent } from "../../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { AddExchangeToDiscussion } from "./AddExchangeToDiscussion";

const domain = "my-domain.com";
const replyDomain = `reply.${domain}`;

describe("AddExchangeToDiscussion", () => {
  let uow: InMemoryUnitOfWork;
  let addExchangeToDiscussion: AddExchangeToDiscussion;

  beforeEach(() => {
    uow = createInMemoryUow();

    addExchangeToDiscussion = new AddExchangeToDiscussion(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        uuidGenerator: new UuidV4Generator(),
        timeGateway: new CustomTimeGateway(),
      }),
      domain,
    );
  });

  describe("right paths", () => {
    const discussion1 = new DiscussionBuilder()
      .withAppellationCode("20567")
      .withId("my-discussion-id-1")
      .withExchanges([
        {
          subject: "Ma discussion 1",
          message: "Hello",
          sender: "potentialBeneficiary",
          sentAt: new Date().toISOString(),
          recipient: "establishment",
          attachments: [],
        },
      ])
      .build();

    const discussion2 = new DiscussionBuilder()
      .withAppellationCode("13252")
      .withId("my-discussion-id-2")
      .withExchanges([
        {
          subject: "",
          message: "Hello",
          sender: "potentialBeneficiary",
          sentAt: new Date().toISOString(),
          recipient: "establishment",
          attachments: [],
        },
      ])
      .build();

    beforeEach(() => {
      uow.discussionRepository.discussions = [discussion1, discussion2];
    });

    it("saves the new exchange in the discussion with attachment ref", async () => {
      const brevoResponse = createBrevoResponse([
        `firstname1_lastname1__${discussion1.id}_b@${replyDomain}`,
        `firstname2_lastname2__${discussion2.id}_e@${replyDomain}`,
      ]);
      await addExchangeToDiscussion.execute(brevoResponse);

      expectToEqual(uow.discussionRepository.discussions, [
        {
          ...discussion1,
          exchanges: [
            ...discussion1.exchanges,
            {
              message: brevoResponse.items[0].RawHtmlBody,
              sender: "establishment",
              sentAt: "2023-06-28T08:06:52.000Z",
              recipient: "potentialBeneficiary",
              subject: brevoResponse.items[0].Subject,
              attachments: brevoResponse.items[0].Attachments?.length
                ? [
                    {
                      name: brevoResponse.items[0].Attachments[0].Name,
                      link: brevoResponse.items[0].Attachments[0].DownloadToken,
                    },
                  ]
                : [],
            },
          ],
        },
        {
          ...discussion2,
          exchanges: [
            ...discussion2.exchanges,
            {
              message: brevoResponse.items[1].RawHtmlBody,
              sender: "potentialBeneficiary",
              sentAt: "2023-06-28T08:06:52.000Z",
              recipient: "establishment",
              subject: brevoResponse.items[1].Subject,
              attachments: brevoResponse.items[1].Attachments?.length
                ? [
                    {
                      name: brevoResponse.items[1].Attachments[0].Name,
                      link: brevoResponse.items[1].Attachments[0].DownloadToken,
                    },
                  ]
                : [],
            },
          ],
        },
      ]);

      expectArraysToMatch(uow.outboxRepository.events, [
        {
          topic: "ExchangeAddedToDiscussion",
          payload: { discussionId: discussion1.id, siret: discussion1.siret },
        },
        {
          topic: "ExchangeAddedToDiscussion",
          payload: { discussionId: discussion2.id, siret: discussion2.siret },
        },
      ]);
    });

    it("saves the new exchange in the discussion with attachment ref and with a default subject if not provided", async () => {
      const brevoResponse = createBrevoResponse(
        [
          `firstname1_lastname1__${discussion1.id}_b@${replyDomain}`,
          `firstname2_lastname2__${discussion2.id}_e@${replyDomain}`,
        ],
        "",
      );
      await addExchangeToDiscussion.execute(brevoResponse);

      expectToEqual(uow.discussionRepository.discussions, [
        {
          ...discussion1,
          exchanges: [
            ...discussion1.exchanges,
            {
              sender: "establishment",
              recipient: "potentialBeneficiary",
              subject: "Sans objet",
              message: brevoResponse.items[0].RawHtmlBody,
              sentAt: new Date(brevoResponse.items[0].SentAtDate).toISOString(),
              attachments: brevoResponse.items[0].Attachments?.length
                ? [
                    {
                      name: brevoResponse.items[0].Attachments[0].Name,
                      link: brevoResponse.items[0].Attachments[0].DownloadToken,
                    },
                  ]
                : [],
            },
          ],
        },
        {
          ...discussion2,
          exchanges: [
            ...discussion2.exchanges,
            {
              sender: "potentialBeneficiary",
              recipient: "establishment",
              subject: "Sans objet",
              sentAt: new Date(brevoResponse.items[1].SentAtDate).toISOString(),
              message: brevoResponse.items[1].RawHtmlBody,
              attachments: brevoResponse.items[1].Attachments?.length
                ? [
                    {
                      name: brevoResponse.items[1].Attachments[0].Name,
                      link: brevoResponse.items[1].Attachments[0].DownloadToken,
                    },
                  ]
                : [],
            },
          ],
        },
      ]);

      expectArraysToMatch(uow.outboxRepository.events, [
        {
          topic: "ExchangeAddedToDiscussion",
          payload: { discussionId: discussion1.id, siret: discussion1.siret },
        },
        {
          topic: "ExchangeAddedToDiscussion",
          payload: { discussionId: discussion2.id, siret: discussion2.siret },
        },
      ]);
    });
  });

  describe("wrong paths", () => {
    it("throws an error if the email does not have the right format", async () => {
      const email = "gerard@reply-dev.immersion-facile.beta.gouv.fr";
      await expectPromiseToFailWithError(
        addExchangeToDiscussion.execute(createBrevoResponse([email])),
        new ZodError([
          {
            validation: "regex",
            code: "invalid_string",
            message:
              "invalide - valeur fournie : gerard@reply-dev.immersion-facile.beta.gouv.fr",
            path: [],
          },
        ]),
      );
    });

    it("throws an error if the email does not have the right recipient kind", async () => {
      await expectPromiseToFailWithError(
        addExchangeToDiscussion.execute(
          createBrevoResponse([
            `firstname_lastname__discussionId_bob@${replyDomain}`,
          ]),
        ),
        errors.discussion.badRecipientKindFormat({ kind: "bob" }),
      );
    });

    it("throws an error if the discussion does not exist", async () => {
      const discussionId = "my-discussion-id";
      const email = `firstname_lastname__${discussionId}_e@${replyDomain}`;
      const brevoResponse = createBrevoResponse([email]);
      await expectPromiseToFailWithError(
        addExchangeToDiscussion.execute(brevoResponse),
        errors.discussion.notFound({ discussionId }),
      );
    });
  });
});

const createBrevoResponse = (
  toAddresses: string[],
  subject?: string,
): BrevoInboundBody => ({
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
    Subject: subject ?? "Fwd: Hey !",
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
