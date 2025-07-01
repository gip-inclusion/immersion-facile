import {
  expectArraysToMatch,
  expectToEqual,
  getFormattedFirstnameAndLastname,
  immersionFacileNoReplyEmailSender,
  type UserWithAdminRights,
} from "shared";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import type { GenerateEmailAuthCodeJwt } from "../../../jwt";
import { makeSaveNotificationAndRelatedEvent } from "../../../notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type InitiateLoginByEmail,
  makeInitiateLoginByEmail,
} from "./InitiateLoginByEmail";

describe("RequestLoginByEmail usecase", () => {
  let initiateLoginByEmail: InitiateLoginByEmail;
  let uow: InMemoryUnitOfWork;
  let timeGateway: TimeGateway;
  let uuidGenerator: TestUuidGenerator;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  const fakeJwt = "fake-email-auth-jwt";
  const fakeGenerateEmailAuthCode: GenerateEmailAuthCodeJwt = () => fakeJwt;

  const baseUrl = "http://after-login.com";
  const redirectUri = "/dashboard/discussions?discussionId=discussion0";

  const user: UserWithAdminRights = {
    id: "user-id",
    firstName: "Bob",
    lastName: "L'éponge",
    email: "email@mail.com",
    createdAt: new Date().toISOString(),
    proConnect: null,
  };

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    initiateLoginByEmail = makeInitiateLoginByEmail({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
          uuidGenerator,
          timeGateway,
        ),
        uuidGenerator,
        generateEmailAuthCodeJwt: fakeGenerateEmailAuthCode,
        oAuthConfig: {
          clientId: "",
          clientSecret: "",
          immersionRedirectUri: {
            afterLogin: "http://after-login.com",
            afterLogout: "http://after-logout.com",
          },
          providerBaseUri: "https://toto.com",
          scope: "",
        },
      },
    });
  });

  it("When user exist by email", async () => {
    const state = "state1";
    uuidGenerator.setNextUuids(["nonce1", state]);
    uow.userRepository.users = [user];

    await initiateLoginByEmail.execute({
      email: user.email,
      redirectUri,
    });

    expectToEqual(uow.ongoingOAuthRepository.ongoingOAuths, [
      {
        fromUri: redirectUri,
        provider: "email",
        userId: user.id,
        nonce: "nonce1",
        state,
        email: user.email,
        usedAt: null,
      },
    ]);

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "LOGIN_BY_EMAIL_REQUESTED",
          params: {
            loginLink: `${baseUrl}?code=${fakeJwt}&state=${state}`,
            fullname: getFormattedFirstnameAndLastname({
              firstname: user.firstName,
              lastname: user.lastName,
            }),
          },
          recipients: [user.email],
          sender: immersionFacileNoReplyEmailSender,
        },
      ],
    });

    expectArraysToMatch(uow.outboxRepository.events, [
      { topic: "NotificationAdded", priority: 1 },
    ]);
  });

  it("When user does not exist by email", async () => {
    const state = "state1";

    uuidGenerator.setNextUuids(["nonce1", state]);
    uow.userRepository.users = [];

    await initiateLoginByEmail.execute({
      email: user.email,
      redirectUri,
    });

    expectToEqual(uow.ongoingOAuthRepository.ongoingOAuths, [
      {
        fromUri: redirectUri,
        provider: "email",
        nonce: "nonce1",
        state,
        email: user.email,
        usedAt: null,
      },
    ]);

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "LOGIN_BY_EMAIL_REQUESTED",
          params: {
            loginLink: `${baseUrl}?code=${fakeJwt}&state=${state}`,
            fullname: "",
          },
          recipients: [user.email],
          sender: immersionFacileNoReplyEmailSender,
        },
      ],
    });
  });
});
