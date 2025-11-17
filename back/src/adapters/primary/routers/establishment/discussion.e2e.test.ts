import { addDays } from "date-fns";
import {
  ConnectedUserBuilder,
  currentJwtVersions,
  DiscussionBuilder,
  defaultCountryCode,
  displayRouteName,
  type EstablishmentRoutes,
  type Exchange,
  errors,
  establishmentRoutes,
  expectArraysToMatch,
  expectHttpResponseToEqual,
  expectToEqual,
  FormEstablishmentDtoBuilder,
  updatedAddress1,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type supertest from "supertest";
import type { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import type { GenerateConnectedUserJwt } from "../../../../domains/core/jwt";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../../domains/core/sirene/adapters/InMemorySiretGateway";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { EstablishmentAggregateBuilder } from "../../../../domains/establishment/helpers/EstablishmentBuilders";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import {
  buildTestApp,
  type InMemoryGateways,
} from "../../../../utils/buildTestApp";

describe("discussion e2e", () => {
  let httpClient: HttpClient<EstablishmentRoutes>;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateConnectedUserJwt: GenerateConnectedUserJwt;
  let eventCrawler: BasicEventCrawler;

  const formEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
    .build();

  const establishmentAdminUserBuilder = new ConnectedUserBuilder()
    .withId("admin")
    .withEmail("admin@establishment.mail");

  const establishmentAdminUser = establishmentAdminUserBuilder.buildUser();
  const establishmentAdminConnectedUser = establishmentAdminUserBuilder.build();

  const existingEstablishment = new EstablishmentAggregateBuilder()
    .withEstablishmentSiret(formEstablishment.siret)
    .withUserRights([
      {
        role: "establishment-admin",
        job: "Boss",
        phone: "+33688774455",
        userId: establishmentAdminUser.id,
        shouldReceiveDiscussionNotifications: true,
        isMainContactByPhone: false,
      },
    ])
    .build();

  beforeEach(async () => {
    let request: supertest.SuperTest<supertest.Test>;
    ({
      request,
      gateways,
      inMemoryUow,
      generateConnectedUserJwt,
      eventCrawler,
    } = await buildTestApp(new AppConfigBuilder().build()));
    httpClient = createSupertestSharedClient(establishmentRoutes, request);

    inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
      existingEstablishment,
    ];

    gateways.addressApi.setNextLookupStreetAndAddresses([
      [
        {
          address: {
            ...updatedAddress1.addressAndPosition.address,
            countryCode: defaultCountryCode,
          },
          position: updatedAddress1.addressAndPosition.position,
        },
      ],
    ]);
    gateways.timeGateway.defaultDate = new Date();

    inMemoryUow.userRepository.users = [establishmentAdminUser];
  });

  describe(`${displayRouteName(
    establishmentRoutes.getDiscussionByIdForEstablishment,
  )} returns the discussion`, () => {
    it("gets the discussion for the establishment", async () => {
      const discussion = new DiscussionBuilder()
        .withSiret(existingEstablishment.establishment.siret)
        .build();

      inMemoryUow.discussionRepository.discussions = [discussion];

      expectHttpResponseToEqual(
        await httpClient.getDiscussionByIdForEstablishment({
          headers: {
            authorization: generateConnectedUserJwt({
              userId: establishmentAdminConnectedUser.id,
              version: currentJwtVersions.connectedUser,
            }),
          },
          urlParams: { discussionId: discussion.id },
        }),
        {
          status: 200,
          body: new DiscussionBuilder(discussion).buildRead(),
        },
      );
    });
  });

  describe("update discussion status", () => {
    describe(`${displayRouteName(
      establishmentRoutes.updateDiscussionStatus,
    )}`, () => {
      it("400 - throws if discussion is already rejected", async () => {
        const discussion = new DiscussionBuilder()
          .withSiret(existingEstablishment.establishment.siret)
          .withStatus({
            status: "REJECTED",
            rejectionKind: "UNABLE_TO_HELP",
          })
          .build();

        inMemoryUow.discussionRepository.discussions = [discussion];

        expectHttpResponseToEqual(
          await httpClient.updateDiscussionStatus({
            headers: {
              authorization: generateConnectedUserJwt({
                userId: establishmentAdminConnectedUser.id,
                version: currentJwtVersions.connectedUser,
              }),
            },
            urlParams: {
              discussionId: discussion.id,
            },
            body: {
              status: "REJECTED",
              rejectionKind: "OTHER",
              rejectionReason: "No reason",
            },
          }),
          {
            status: 400,
            body: {
              message: errors.discussion.alreadyRejected({
                discussionId: discussion.id,
              }).message,
              status: 400,
            },
          },
        );
      });
      it("401 - throws if user is not known", async () => {
        const discussion = new DiscussionBuilder()
          .withSiret(existingEstablishment.establishment.siret)
          .build();

        inMemoryUow.discussionRepository.discussions = [discussion];

        const response = await httpClient.updateDiscussionStatus({
          headers: { authorization: "" },
          urlParams: {
            discussionId: discussion.id,
          },
          body: {
            status: "REJECTED",
            rejectionKind: "OTHER",
            rejectionReason: "No reason",
          },
        });

        expectHttpResponseToEqual(response, {
          status: 401,
          body: {
            message: "Veuillez vous authentifier",
            status: 401,
          },
        });
      });
      it("403 - throws if user is not bound to discussion", async () => {
        const discussion = new DiscussionBuilder()
          .withSiret(existingEstablishment.establishment.siret)
          .build();

        inMemoryUow.discussionRepository.discussions = [discussion];
        inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(discussion.siret)
            .withUserRights([
              {
                role: "establishment-admin",
                userId: "other",
                job: "",
                phone: "",
                shouldReceiveDiscussionNotifications: true,
                isMainContactByPhone: false,
              },
            ])
            .build(),
        ];

        const response = await httpClient.updateDiscussionStatus({
          headers: {
            authorization: generateConnectedUserJwt({
              userId: establishmentAdminConnectedUser.id,
              version: currentJwtVersions.connectedUser,
            }),
          },
          urlParams: {
            discussionId: discussion.id,
          },
          body: {
            status: "REJECTED",
            rejectionKind: "OTHER",
            rejectionReason: "No reason",
          },
        });
        expectHttpResponseToEqual(response, {
          status: 403,
          body: {
            message: errors.discussion.rejectForbidden({
              discussionId: discussion.id,
              userId: establishmentAdminConnectedUser.id,
            }).message,
            status: 403,
          },
        });
      });
      it("200 - rejects discussion", async () => {
        const discussion = new DiscussionBuilder()
          .withSiret(existingEstablishment.establishment.siret)
          .build();

        inMemoryUow.discussionRepository.discussions = [discussion];

        gateways.timeGateway.defaultDate = addDays(
          new Date(discussion.createdAt),
          2,
        );

        expectHttpResponseToEqual(
          await httpClient.updateDiscussionStatus({
            headers: {
              authorization: generateConnectedUserJwt({
                userId: establishmentAdminConnectedUser.id,
                version: currentJwtVersions.connectedUser,
              }),
            },
            urlParams: {
              discussionId: discussion.id,
            },
            body: {
              status: "REJECTED",
              rejectionKind: "OTHER",
              rejectionReason: "No reason",
            },
          }),
          {
            status: 200,
            body: "",
          },
        );

        const emailSubject =
          "L’entreprise My default business name ne souhaite pas donner suite à votre candidature à l’immersion";

        expectArraysToMatch(inMemoryUow.outboxRepository.events, [
          {
            topic: "DiscussionStatusManuallyUpdated",
            payload: {
              discussion: {
                ...discussion,
                status: "REJECTED",
                rejectionKind: "OTHER",
                rejectionReason: "No reason",
                updatedAt: gateways.timeGateway.now().toISOString(),
                exchanges: [
                  ...discussion.exchanges,
                  {
                    subject: emailSubject,
                    message: expect.any(String),
                    sender: "establishment",
                    firstname: establishmentAdminConnectedUser.firstName,
                    lastname: establishmentAdminConnectedUser.lastName,
                    email: establishmentAdminConnectedUser.email,
                    sentAt: gateways.timeGateway.now().toISOString(),
                    attachments: [],
                  },
                ],
              },
              triggeredBy: {
                kind: "connected-user",
                userId: establishmentAdminConnectedUser.id,
              },
            },
          },
        ]);

        await eventCrawler.processNewEvents();

        expectArraysToMatch(inMemoryUow.notificationRepository.notifications, [
          {
            kind: "email",
            templatedContent: {
              kind: "DISCUSSION_EXCHANGE",
              params: {
                htmlContent: expect.any(String),
                subject: emailSubject,
              },
              recipients: [discussion.potentialBeneficiary.email],
              attachments: [],
            },
            followedIds: {
              userId: establishmentAdminConnectedUser.id,
              establishmentSiret: discussion.siret,
            },
          },
        ]);
      });
    });
  });

  describe(`${displayRouteName(establishmentRoutes.replyToDiscussion)}`, () => {
    const user = new ConnectedUserBuilder().buildUser();
    const establishment = new EstablishmentAggregateBuilder()
      .withUserRights([
        {
          role: "establishment-admin",
          job: "osef",
          phone: "osef",
          userId: user.id,
          shouldReceiveDiscussionNotifications: true,
          isMainContactByPhone: false,
        },
      ])
      .build();

    beforeEach(() => {
      inMemoryUow.userRepository.users = [user];
      inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
        establishment,
      ];
    });

    it("200 - saves the exchange to a discussion", async () => {
      const discussion = new DiscussionBuilder()
        .withSiret(establishment.establishment.siret)
        .build();

      inMemoryUow.discussionRepository.discussions = [discussion];

      const expectedExchange: Exchange = {
        subject:
          "Réponse de My default business name à votre demande d'immersion",
        message: "My fake message",
        sentAt: gateways.timeGateway.now().toISOString(),
        sender: "establishment",
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        attachments: [],
      };

      expectHttpResponseToEqual(
        await httpClient.replyToDiscussion({
          headers: {
            authorization: generateConnectedUserJwt({
              userId: user.id,
              version: currentJwtVersions.connectedUser,
            }),
          },
          urlParams: { discussionId: discussion.id },
          body: {
            message: expectedExchange.message,
          },
        }),
        {
          status: 200,
          body: expectedExchange,
        },
      );

      expectArraysToMatch(inMemoryUow.discussionRepository.discussions, [
        new DiscussionBuilder(discussion)
          .withExchanges([...discussion.exchanges, expectedExchange])
          .withUpdatedAt(gateways.timeGateway.now())
          .build(),
      ]);
    });

    it("202 - not save the exchange to a discussion - bad discusssion status", async () => {
      const discussion = new DiscussionBuilder()
        .withSiret(establishment.establishment.siret)
        .withStatus({ status: "REJECTED", rejectionKind: "NO_TIME" })
        .build();

      inMemoryUow.discussionRepository.discussions = [discussion];

      expectHttpResponseToEqual(
        await httpClient.replyToDiscussion({
          headers: {
            authorization: generateConnectedUserJwt({
              userId: user.id,
              version: currentJwtVersions.connectedUser,
            }),
          },
          urlParams: { discussionId: discussion.id },
          body: {
            message: "My fake message",
          },
        }),
        {
          status: 202,
          body: { reason: "discussion_completed", sender: "establishment" },
        },
      );

      expectToEqual(inMemoryUow.discussionRepository.discussions, [discussion]);
    });
  });
});
