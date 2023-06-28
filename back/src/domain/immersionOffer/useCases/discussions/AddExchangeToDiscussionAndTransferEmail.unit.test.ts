import { expectPromiseToFailWithError, expectToEqual } from "shared";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  NotFoundError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { InMemoryDiscussionAggregateRepository } from "../../../../adapters/secondary/immersionOffer/InMemoryDiscussionAggregateRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { DiscussionAggregate } from "../../entities/DiscussionAggregate";
import {
  AddExchangeToDiscussionAndTransferEmail,
  BrevoInboundResponse,
} from "./AddExchangeToDiscussionAndTransferEmail";

describe("AddExchangeToDiscussionAndTransferEmail", () => {
  let discussionAggregateRepository: InMemoryDiscussionAggregateRepository;
  let addExchangeToDiscussionAndTransferEmail: AddExchangeToDiscussionAndTransferEmail;

  beforeEach(() => {
    const uow = createInMemoryUow();
    discussionAggregateRepository = uow.discussionAggregateRepository;
    const uowPerformer = new InMemoryUowPerformer(uow);
    addExchangeToDiscussionAndTransferEmail =
      new AddExchangeToDiscussionAndTransferEmail(uowPerformer);
  });

  describe("right paths", () => {
    it("saves the new exchange in the discussion", async () => {
      const discussionId = "my-discussion-id";
      const brevoResponse = createBrevoResponse(
        `${discussionId}_b@reply-dev.immersion-facile.beta.gouv.fr`,
      );
      const discussion: DiscussionAggregate = {
        id: discussionId,
        exchanges: [
          {
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
          email: "test@immersion-facile.beta.gouv.fr",
          firstName: "Roger",
          lastName: "Rabbit",
          phone: "0123456789",
          job: "Directeur",
        },
        immersionObjective: "Confirmer un projet professionnel",
        potentialBeneficiary: {
          email: "test-benef@immersion-facile.beta.gouv.fr",
          firstName: "Baby",
          lastName: "Herman",
          phone: "0123456754",
          resumeLink: "http://fakelink.com",
        },
        siret: "01234567891011",
      };
      discussionAggregateRepository.discussionAggregates = [discussion];
      await addExchangeToDiscussionAndTransferEmail.execute(brevoResponse);
      const expected = discussionAggregateRepository.discussionAggregates;

      expectToEqual(expected[0].exchanges, [
        ...discussion.exchanges,
        {
          message: brevoResponse.items[0].RawHtmlBody,
          sender: "establishment",
          sentAt: new Date("2023-06-28T08:06:52.000Z"),
          recipient: "potentialBeneficiary",
        },
      ]);
    });
    // it("sends the email to the right recipient", () => {});
  });
  describe("wrong paths", () => {
    it("throws an error if the email does not have the right format", async () => {
      await expectPromiseToFailWithError(
        addExchangeToDiscussionAndTransferEmail.execute(
          createBrevoResponse("gerard@reply-dev.immersion-facile.beta.gouv.fr"),
        ),
        new BadRequestError(
          `Email does not have the right format email to : gerard@reply-dev.immersion-facile.beta.gouv.fr`,
        ),
      );
    });

    it("throws an error if the email does not have the right recipient kind", async () => {
      await expectPromiseToFailWithError(
        addExchangeToDiscussionAndTransferEmail.execute(
          createBrevoResponse(
            "iozeuroiu897654654_bob@reply-dev.immersion-facile.beta.gouv.fr",
          ),
        ),
        new BadRequestError(`Email does not have the right format kind : bob`),
      );
    });

    it("throws an error if the discussion does not exist", async () => {
      const discussionId = "my-discussion-id";
      const brevoResponse = createBrevoResponse(
        `${discussionId}_e@reply-dev.immersion-facile.beta.gouv.fr`,
      );
      await expectPromiseToFailWithError(
        addExchangeToDiscussionAndTransferEmail.execute(brevoResponse),
        new NotFoundError(`Discussion ${discussionId} not found`),
      );
    });
  });
});

const createBrevoResponse = (toAddress: string): BrevoInboundResponse => ({
  items: [
    {
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
          Address: toAddress,
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
      Headers: {
        Received:
          "by mail-pg1-f170.google.com with SMTP id 41be03b00d2f7-55adfa61199so2305638a12.2 for <gerard-cci@reply-dev.immersion-facile.beta.gouv.fr>; Wed, 28 Jun 2023 01:07:05 -0700 (PDT)",
        "DKIM-Signature":
          "v=1; a=rsa-sha256; c=relaxed/relaxed; d=gmail.com; s=20221208; t=1687939624; x=1690531624; h=cc:to:subject:message-id:date:from:in-reply-to:references :mime-version:from:to:cc:subject:date:message-id:reply-to; bh=5mLottnptVJ8Np/JdvJ3fk4nPhLjJ+6wz4VKeenH+ZA=; b=dRIiuIB/Lb9ROZsf95p6lepuq7imgs210mXsRHjpL5NA6ylnFNy05uM5oEo0XbVplP UNz3ky4ejvFGudFyDP8I2DCHI1F8s1H3ap/TIUTQ7GglV2NMDcxdnj0zCoj1eFjY+W6o 1b/hehPyxtte+BhXDd34DAwjO9s1VlfCmfzEy84j4TyQiMxBRKYFyOuU0dE20dWhDXpW JHGz22nF2tJtBwuJVpqfycV1ETyLGrXhqbmEJ2fUVsfduCfGraF5eEELMTmdZC/7Zrq1 yhcPEQrfzPZl9SvDhMb9RnNNs+esBTM8nBp53c50XlHO0ATMJ0YSdjOcM46YhV8Ho8Vj lL4g==",
        "X-Google-DKIM-Signature":
          "v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20221208; t=1687939624; x=1690531624; h=cc:to:subject:message-id:date:from:in-reply-to:references :mime-version:x-gm-message-state:from:to:cc:subject:date:message-id :reply-to; bh=5mLottnptVJ8Np/JdvJ3fk4nPhLjJ+6wz4VKeenH+ZA=; b=H7cF6YpP6Radnv+UxqbOykW2YozFdlR5BR4K0ByvQL7CuXXfuQVNrRvbO1Tn+Wxsd/ ElOgYCDgi4k+9FkajLPB74jKXxXN8T6FIcUpGI6184HQOo+WOYgen7aCzFE4/XsVRe1D Zzy0ne1VKdArpkq3d7BJBXL3c9Y14mcfZOc0kezah5sBH5b0MJ7hLYqp95jxtk/IPei1 e4rnjl2rzRU5Yp8lwVi2ucSNyi5HhNmw4/LgqtsPxDijBoW3E39I6/1hHYkGNiDDz5fP uQFdsJsgXmVb6ZqDsiXr00lfkbLhLnwXEnZGtuoZozKWBQutaN+Ulr9UwppqDVJTQWnN Z5bw==",
        "X-Gm-Message-State":
          "AC+VfDxojaLAZ4xxtgMo8jTS3MbQQxixxTg5fvVZXnEG/JADC5/18czy vCHJREUgU4IXOVOFKcs9NdsH1X5eS60SedWv+Yo=",
        "X-Google-Smtp-Source":
          "ACHHUZ7Q/5aubNwGXzNkF579ByfIh5M7amCsL8FUwF1YQUIncq48jW4mOnb/p4AtH/wvsZiBauQbOLVWWtOARnep6ds=",
        "X-Received":
          "by 2002:a17:90b:1b03:b0:262:e634:7acd with SMTP id nu3-20020a17090b1b0300b00262e6347acdmr8435316pjb.3.1687939623998; Wed, 28 Jun 2023 01:07:03 -0700 (PDT)",
        "MIME-Version": "1.0",
        References:
          "<CADYedJvULotGuHgoSgZ7mgrj-mUa6+jbv8Eg1fXLLwTBUiSL-A@mail.gmail.com> <CADYedJsS=ZXd8RPDjNuD7GhOwCgvaLwvAS=2kU3N+sd5wgu6Ag@mail.gmail.com>",
        "In-Reply-To":
          "<CADYedJsS=ZXd8RPDjNuD7GhOwCgvaLwvAS=2kU3N+sd5wgu6Ag@mail.gmail.com>",
        From: "Enguerran Weiss <enguerranweiss@gmail.com>",
        Date: "Wed, 28 Jun 2023 10:06:52 +0200",
        "Message-ID":
          "<CADYedJsX7_KwtMJem4m-Dhwqp5fmBiqrdMzzDBu-7nbfAuY=ew@mail.gmail.com>",
        Subject: "Fwd: Hey !",
        To: "gerard@reply-dev.immersion-facile.beta.gouv.fr",
        Cc: "gerard2@reply-dev.immersion-facile.beta.gouv.fr, gerard-cc@reply-dev.imersion-facile.beta.gouv.fr",
        "Content-Type": "multipart/related",
        Bcc: "gerard-cci@reply-dev.immersion-facile.beta.gouv.fr",
      },
      SpamScore: 2.403964,
      ExtractedMarkdownMessage:
        "---------- Forwarded message --------- \nDe : **Enguerran Weiss** &lt;[enguerranweiss@gmail.com](mailto:enguerranweiss@gmail.com)&gt; \nDate: mer. 28 juin 2023 à 09:57 \nSubject: Fwd: Hey ! \nTo: &lt;[tristan@reply-dev.immersion-facile.beta.gouv.fr](mailto:tristan@reply-dev.immersion-facile.beta.gouv.fr)&gt; \n\n---------- Forwarded message --------- \n> De : **Enguerran Weiss** &lt;[enguerranweiss@gmail.com](mailto:enguerranweiss@gmail.com)&gt; \n> Date: mer. 28 juin 2023 à 09:55 \n> Subject: Hey ! \n> To: &lt;[roger@reply-dev.immersion-facile.gouv.fr](mailto:roger@reply-dev.immersion-facile.gouv.fr)&gt; \n>\n> Comment ça va ? \n>\n> [IMG_20230617_151239.jpg](cid:ii_ljff7lfo0) \n>\n> A + ! \n\n-- \n\n[goodies.enguerranweiss.fr/id/sign_html-v…](http://goodies.enguerranweiss.fr/id/sign_html-v2-bl.png) \n\n+33(0)6 10 13 76 84  \n[hello@enguerranweiss.fr](mailto:hello@enguerranweiss.fr) \n[http://www.enguerranweiss.fr](http://www.enguerranweiss.fr)\n\n-- \n\n[goodies.enguerranweiss.fr/id/sign_html-v…](http://goodies.enguerranweiss.fr/id/sign_html-v2-bl.png) \n\n+33(0)6 10 13 76 84  \n[hello@enguerranweiss.fr](mailto:hello@enguerranweiss.fr) \n[http://www.enguerranweiss.fr](http://www.enguerranweiss.fr)\n\n-- \n\n[goodies.enguerranweiss.fr/id/sign_html-v…](http://goodies.enguerranweiss.fr/id/sign_html-v2-bl.png) \n\n+33(0)6 10 13 76 84  \n[hello@enguerranweiss.fr](mailto:hello@enguerranweiss.fr) \n[http://www.enguerranweiss.fr](http://www.enguerranweiss.fr)",
      ExtractedMarkdownSignature: null,
      RawHtmlBody:
        '<div dir="ltr"><br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>De : <b class="gmail_sendername" dir="auto">Enguerran Weiss</b> <span dir="auto">&lt;<a href="mailto:enguerranweiss@gmail.com">enguerranweiss@gmail.com</a>&gt;</span><br>Date: mer. 28 juin 2023 à 09:57<br>Subject: Fwd: Hey !<br>To: &lt;<a href="mailto:tristan@reply-dev.immersion-facile.beta.gouv.fr">tristan@reply-dev.immersion-facile.beta.gouv.fr</a>&gt;<br></div><br><br><div dir="ltr"><br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>De : <b class="gmail_sendername" dir="auto">Enguerran Weiss</b> <span dir="auto">&lt;<a href="mailto:enguerranweiss@gmail.com" target="_blank">enguerranweiss@gmail.com</a>&gt;</span><br>Date: mer. 28 juin 2023 à 09:55<br>Subject: Hey !<br>To: &lt;<a href="mailto:roger@reply-dev.immersion-facile.gouv.fr" target="_blank">roger@reply-dev.immersion-facile.gouv.fr</a>&gt;<br></div><br><br><div dir="ltr"><div><br clear="all"></div><div>Comment ça va ?</div><div><br></div><div><img src="cid:ii_ljff7lfo0" alt="IMG_20230617_151239.jpg" style="margin-right:0px" width="223" height="167"></div><div><br></div><div><br></div><div>A + !<br></div><div><br></div><div><span class="gmail_signature_prefix">-- </span><br><div dir="ltr" class="gmail_signature" data-smartmail="gmail_signature"><div dir="ltr"><div><div dir="ltr"><span style="color:rgb(0,0,0);font-family:Times;font-size:medium"><img src="http://goodies.enguerranweiss.fr/id/sign_html-v2-bl.png"></span><p style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:rgb(102,102,102)"></p><p style="font-family:Georgia,serif;font-size:11px;color:rgb(102,102,102)">+33(0)6 10 13 76 84 <br><a href="mailto:hello@enguerranweiss.fr" target="_blank">hello@enguerranweiss.fr</a><br><a href="http://www.enguerranweiss.fr" target="_blank">http://www.enguerranweiss.fr</a></p></div></div></div></div></div></div>\r\n</div><br clear="all"><br><span class="gmail_signature_prefix">-- </span><br><div dir="ltr" class="gmail_signature" data-smartmail="gmail_signature"><div dir="ltr"><div><div dir="ltr"><span style="color:rgb(0,0,0);font-family:Times;font-size:medium"><img src="http://goodies.enguerranweiss.fr/id/sign_html-v2-bl.png"></span><p style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:rgb(102,102,102)"></p><p style="font-family:Georgia,serif;font-size:11px;color:rgb(102,102,102)">+33(0)6 10 13 76 84 <br><a href="mailto:hello@enguerranweiss.fr" target="_blank">hello@enguerranweiss.fr</a><br><a href="http://www.enguerranweiss.fr" target="_blank">http://www.enguerranweiss.fr</a></p></div></div></div></div></div>\r\n</div><br clear="all"><br><span class="gmail_signature_prefix">-- </span><br><div dir="ltr" class="gmail_signature" data-smartmail="gmail_signature"><div dir="ltr"><div><div dir="ltr"><span style="color:rgb(0,0,0);font-family:Times;font-size:medium"><img src="http://goodies.enguerranweiss.fr/id/sign_html-v2-bl.png"></span><p style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:rgb(102,102,102)"></p><p style="font-family:Georgia,serif;font-size:11px;color:rgb(102,102,102)">+33(0)6 10 13 76 84 <br><a href="mailto:hello@enguerranweiss.fr" target="_blank">hello@enguerranweiss.fr</a><br><a href="http://www.enguerranweiss.fr" target="_blank">http://www.enguerranweiss.fr</a></p></div></div></div></div></div>\r\n',
      RawTextBody:
        "---------- Forwarded message ---------\r\nDe : Enguerran Weiss <enguerranweiss@gmail.com>\r\nDate: mer. 28 juin 2023 à 09:57\r\nSubject: Fwd: Hey !\r\nTo: <tristan@reply-dev.immersion-facile.beta.gouv.fr>\r\n\n\n\n\n---------- Forwarded message ---------\r\nDe : Enguerran Weiss <enguerranweiss@gmail.com>\r\nDate: mer. 28 juin 2023 à 09:55\r\nSubject: Hey !\r\nTo: <roger@reply-dev.immersion-facile.gouv.fr>\r\n\n\n\nComment ça va ?\r\n\n[image: IMG_20230617_151239.jpg]\r\n\n\nA + !\r\n\n-- \r\n\n+33(0)6 10 13 76 84\r\nhello@enguerranweiss.fr\r\nhttp://www.enguerranweiss.fr\r\n\n\n-- \r\n\n+33(0)6 10 13 76 84\r\nhello@enguerranweiss.fr\r\nhttp://www.enguerranweiss.fr\r\n\n\n-- \r\n\n+33(0)6 10 13 76 84\r\nhello@enguerranweiss.fr\r\nhttp://www.enguerranweiss.fr\r\n",
    },
  ],
});
