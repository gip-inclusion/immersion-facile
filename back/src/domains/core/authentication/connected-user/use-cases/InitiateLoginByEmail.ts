import {
  getFormattedFirstnameAndLastname,
  type InitiateLoginByEmailParams,
  immersionFacileNoReplyEmailSender,
  initiateLoginByEmailParamsSchema,
  type OAuthSuccessLoginParams,
  queryParamsAsString,
} from "shared";
import type { OAuthConfig } from "../../../../../config/bootstrap/appConfig";
import type { GenerateEmailAuthCodeJwt } from "../../../jwt";
import type { SaveNotificationAndRelatedEvent } from "../../../notifications/helpers/Notification";
import { useCaseBuilder } from "../../../useCaseBuilder";
import type { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";

export type InitiateLoginByEmail = ReturnType<typeof makeInitiateLoginByEmail>;
export const makeInitiateLoginByEmail = useCaseBuilder("InitiateLoginByEmail")
  .withInput<InitiateLoginByEmailParams>(initiateLoginByEmailParamsSchema)
  .withOutput<void>()
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    uuidGenerator: UuidGenerator;
    oAuthConfig: OAuthConfig;
    generateEmailAuthCodeJwt: GenerateEmailAuthCodeJwt;
  }>()
  .build(async ({ inputParams: { email, redirectUri }, uow, deps }) => {
    const nonce = deps.uuidGenerator.new();
    const state = deps.uuidGenerator.new();

    const user = await uow.userRepository.findByEmail(email);

    await uow.ongoingOAuthRepository.save({
      fromUri: redirectUri,
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
            }?${queryParamsAsString<OAuthSuccessLoginParams>({
              code: deps.generateEmailAuthCodeJwt({ version: 1 }),
              state,
            })}`,
            fullname:
              user?.firstName && user.lastName
                ? `${getFormattedFirstnameAndLastname({ firstname: user.firstName, lastname: user.lastName })}`
                : "",
          },
        },
        followedIds: { userId: user?.id },
      },
      { priority: 1 },
    );
  });
