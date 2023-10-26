import { SuperTest, Test } from "supertest";
import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  agencyDtoToSaveAgencyParams,
  BrevoInboundBody,
  ConventionDtoBuilder,
  createConventionMagicLinkPayload,
  displayRouteName,
  expectEmailOfType,
  expectHttpResponseToEqual,
  expectObjectsToMatch,
  expectToEqual,
  frontRoutes,
  TechnicalRoutes,
  technicalRoutes,
  ValidateEmailStatus,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import { DiscussionAggregateBuilder } from "../../../../_testBuilders/DiscussionAggregateBuilder";
import { processEventsForEmailToBeSent } from "../../../../_testBuilders/processEventsForEmailToBeSent";
import {
  GenerateBackOfficeJwt,
  GenerateConventionJwt,
  makeGenerateJwtES256,
  makeVerifyJwtES256,
} from "../../../../domain/auth/jwt";
import { ShortLinkId } from "../../../../domain/core/ports/ShortLinkQuery";
import { shortLinkNotFoundMessage } from "../../../../domain/core/ShortLink";
import { shortLinkRedirectToLinkWithValidation } from "../../../../utils/e2eTestHelpers";
import { BasicEventCrawler } from "../../../secondary/core/EventCrawlerImplementations";
import { AppConfig } from "../../config/appConfig";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

const discussionId = "my-discussion-id";
const domain = "immersion-facile.beta.gouv.fr";

describe("technical router", () => {
  let generateConventionJwt: GenerateConventionJwt;
  let generateBackOfficeJwt: GenerateBackOfficeJwt;
  let httpClient: HttpClient<TechnicalRoutes>;
  let appConfig: AppConfig;
  let inMemoryUow: InMemoryUnitOfWork;
  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({
      request,
      generateConventionJwt,
      generateBackOfficeJwt,
      appConfig,
      inMemoryUow,
      gateways,
      eventCrawler,
    } = await buildTestApp(
      new AppConfigBuilder({
        INBOUND_EMAIL_ALLOWED_IPS: "130.10.10.10,::ffff:127.0.0.1",
        DOMAIN: domain,
      }).build(),
    ));
    httpClient = createSupertestSharedClient(technicalRoutes, request);
  });

  describe("/auth/html-to-pdf", () => {
    it(`${displayRouteName(
      technicalRoutes.htmlToPdf,
    )} 200 - Should get PDF content from html string`, async () => {
      const validatorJwt = generateConventionJwt({
        exp: new Date().getTime() / 1000 + 1000,
        iat: new Date().getTime() / 1000,
        version: 1,
        role: "validator",
        emailHash: "my-hash",
        applicationId: "convention-id",
      });
      const response = await httpClient.htmlToPdf({
        body: {
          htmlContent: "<p>some html content</p>",
        },
        headers: {
          authorization: validatorJwt,
        },
      });
      expectToEqual(response.body, 'PDF_OF >> "<p>some html content</p>"');

      expectToEqual(response.status, 200);
    });

    it(`${displayRouteName(
      technicalRoutes.htmlToPdf,
    )} 200 - Should get PDF content from html string with admin token`, async () => {
      const validatorJwt = generateBackOfficeJwt({
        exp: new Date().getTime() / 1000 + 1000,
        iat: new Date().getTime() / 1000,
        sub: "admin",
        version: 1,
        role: "backOffice",
      });
      const response = await httpClient.htmlToPdf({
        body: {
          htmlContent: "<p>some html content</p>",
        },
        headers: {
          authorization: validatorJwt,
        },
      });
      expectToEqual(response.body, 'PDF_OF >> "<p>some html content</p>"');

      expectToEqual(response.status, 200);
    });
  });

  describe("/inbound-email-parsing", () => {
    it(`${displayRouteName(
      technicalRoutes.inboundEmailParsing,
    )} 200 - when IP is allowed and body is correct`, async () => {
      inMemoryUow.discussionAggregateRepository.discussionAggregates = [
        new DiscussionAggregateBuilder().withId(discussionId).build(),
      ];

      const response = await httpClient.inboundEmailParsing({
        body: correctBrevoResponse,
        headers: { "X-Forwarded-For": appConfig.inboundEmailAllowedIps[0] },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: "",
      });
    });

    it(`${displayRouteName(
      technicalRoutes.inboundEmailParsing,
    )} 400 - when IP is allowed and body is wrong`, async () => {
      const response = await httpClient.inboundEmailParsing({
        body: { yolo: "wrong body" } as any,
        headers: { "X-Forwarded-For": appConfig.inboundEmailAllowedIps[0] },
      });

      expectHttpResponseToEqual(response, {
        body: {
          issues: ["items : Required"],
          message:
            "Shared-route schema 'requestBodySchema' was not respected in adapter 'express'.\nRoute: POST /inbound-email-parsing",
          status: 400,
        },
        status: 400,
      });
    });

    it(`${displayRouteName(
      technicalRoutes.inboundEmailParsing,
    )} 403 - when IP is not allowed`, async () => {
      const unallowedIp = "245.10.12.54";
      const response = await httpClient.inboundEmailParsing({
        body: correctBrevoResponse,
        headers: { "X-Forwarded-For": unallowedIp },
      });

      expectHttpResponseToEqual(response, {
        body: {},
        status: 403,
      });
    });
  });

  describe("/renewMagicLink", () => {
    it(`${displayRouteName(
      technicalRoutes.renewMagicLink,
    )} 200 - sends the updated magic link`, async () => {
      const validConvention = new ConventionDtoBuilder().build();

      const agency = AgencyDtoBuilder.create(validConvention.agencyId)
        .withName("TEST-name")
        .withAdminEmails(["admin@email.fr"])
        .withQuestionnaireUrl("TEST-questionnaireUrl")
        .withSignature("TEST-signature")
        .build();
      const agencySaveParams = agencyDtoToSaveAgencyParams(agency);

      const convention = new ConventionDtoBuilder().build();
      inMemoryUow.conventionRepository.setConventions({
        [convention.id]: convention,
      });
      inMemoryUow.agencyRepository.setAgencies([agencySaveParams]);

      gateways.timeGateway.setNextDate(new Date());

      generateConventionJwt = makeGenerateJwtES256<"convention">(
        appConfig.jwtPrivateKey,
        3600 * 24, // one day
      );
      const shortLinkIds = ["shortLink1", "shortLinkg2"];
      gateways.shortLinkGenerator.addMoreShortLinkIds(shortLinkIds);

      const originalUrl = `${appConfig.immersionFacileBaseUrl}/${frontRoutes.conventionToSign}`;

      const expiredJwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: validConvention.id,
          role: "beneficiary",
          email: validConvention.signatories.beneficiary.email,
          now: new Date(),
        }),
      );

      const response = await httpClient.renewMagicLink({
        queryParams: {
          expiredJwt,
          originalUrl: encodeURIComponent(originalUrl),
        },
      });

      expect(response.status).toBe(200);

      await processEventsForEmailToBeSent(eventCrawler);

      const sentEmails = gateways.notification.getSentEmails();

      expect(sentEmails).toHaveLength(1);

      const email = expectEmailOfType(sentEmails[0], "MAGIC_LINK_RENEWAL");
      expect(email.recipients).toEqual([
        validConvention.signatories.beneficiary.email,
      ]);

      const magicLink = await shortLinkRedirectToLinkWithValidation(
        email.params.magicLink,
        httpClient,
      );

      const newUrlStart = `${originalUrl}?jwt=`;

      expect(magicLink.startsWith(newUrlStart)).toBeTruthy();
      const renewedJwt = magicLink.replace(newUrlStart, "");
      expect(renewedJwt !== expiredJwt).toBeTruthy();
      expect(
        makeVerifyJwtES256(appConfig.jwtPublicKey)(renewedJwt),
      ).toBeDefined();
    });
  });

  describe("/to/:shortLinkId", () => {
    const expectedShortLinkId: ShortLinkId = "shortLinkId";

    it(`${displayRouteName(
      technicalRoutes.shortLink,
    )} 302 - Redirect on existing short link`, async () => {
      const expectedLongLink: AbsoluteUrl = "http://longLink";
      inMemoryUow.shortLinkQuery.setShortLinks({
        [expectedShortLinkId]: expectedLongLink,
      });

      const response = await httpClient.shortLink({
        urlParams: { shortLinkId: expectedShortLinkId },
      });

      expectHttpResponseToEqual(response, {
        body: {},
        status: 302,
        headers: { location: expectedLongLink },
      });
    });

    it(`${displayRouteName(
      technicalRoutes.shortLink,
    )} 404 - Not found on missing short link`, async () => {
      const response = await httpClient.shortLink({
        urlParams: { shortLinkId: expectedShortLinkId },
      });

      expect(response.status).toBe(404);
      expectObjectsToMatch(response.body, {
        errors: shortLinkNotFoundMessage(expectedShortLinkId),
      });
    });
  });

  describe(`/validate-email`, () => {
    const candidateEmail = "enguerran.weiss@beta.gouv.fr";
    const expectedStatus: ValidateEmailStatus = {
      isValid: true,
      proposal: null,
      reason: "accepted_email",
    };

    it(`${displayRouteName(
      technicalRoutes.validateEmail,
    )} 200 with '?email=enguerran.weiss@beta.gouv.fr'`, async () => {
      gateways.emailValidationGateway.setEmailValidationStatusResponse(
        expectedStatus,
      );
      const response = await httpClient.validateEmail({
        queryParams: { email: candidateEmail },
      });
      expectHttpResponseToEqual(response, {
        body: expectedStatus,
        status: 200,
      });
    });

    it(`${displayRouteName(
      technicalRoutes.validateEmail,
    )} 400 with '?email="invalid-email"`, async () => {
      const invalidEmail = "invalid-email";
      const response = await httpClient.validateEmail({
        queryParams: {
          email: invalidEmail,
        },
      });
      expectHttpResponseToEqual(response, {
        body: {
          issues: ["email : invalide - valeur fournie : invalid-email"],
          message:
            "Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /validate-email",
          status: 400,
        },
        status: 400,
      });
    });
  });
});

const correctBrevoResponse: BrevoInboundBody = {
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
          Address: `${discussionId}_b@reply.${domain}`,
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
    },
  ],
};
