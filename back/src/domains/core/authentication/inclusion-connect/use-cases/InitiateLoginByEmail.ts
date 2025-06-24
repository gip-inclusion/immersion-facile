import {
  type AuthenticateWithOAuthCodeParams,
  type InitiateLoginByEmailParams,
  immersionFacileNoReplyEmailSender,
  initiateLoginByEmailParamsSchema,
  queryParamsAsString,
} from "shared";
import type { OAuthConfig } from "../../../../../config/bootstrap/appConfig";
import { createTransactionalUseCase } from "../../../UseCase";
import type { GenerateEmailAuthCodeJwt } from "../../../jwt";
import type { SaveNotificationAndRelatedEvent } from "../../../notifications/helpers/Notification";
import type { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";

export type InitiateLoginByEmail = ReturnType<typeof makeInitiateLoginByEmail>;
export const makeInitiateLoginByEmail = createTransactionalUseCase<
  InitiateLoginByEmailParams,
  void,
  void,
  {
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    uuidGenerator: UuidGenerator;
    oAuthConfig: OAuthConfig;
    generateEmailAuthCodeJwt: GenerateEmailAuthCodeJwt;
  }
>(
  {
    inputSchema: initiateLoginByEmailParamsSchema,
    name: "InitiateLoginByEmail",
  },
  async ({ inputParams: { email, page }, uow, deps }) => {
    const nonce = deps.uuidGenerator.new();
    const state = deps.uuidGenerator.new();

    const user = await uow.userRepository.findByEmail(email);

    await uow.ongoingOAuthRepository.save({
      nonce,
      state,
      userId: user?.id,
      provider: "email",
      email,
      usedAt: null,
    });

    await deps.saveNotificationAndRelatedEvent(
      uow,
      {
        kind: "email",
        templatedContent: {
          kind: "LOGIN_BY_EMAIL_REQUESTED",
          recipients: [email],
          sender: immersionFacileNoReplyEmailSender,
          params: {
            loginLink: `${
              deps.oAuthConfig.immersionRedirectUri.afterLogin
            }?${queryParamsAsString<AuthenticateWithOAuthCodeParams>({
              code: deps.generateEmailAuthCodeJwt({ version: 1 }),
              page,
              state,
            })}`,
            fullname:
              user?.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : "",
          },
        },
        followedIds: { userId: user?.id },
      },
      { priority: 1 },
    );
  },
);
