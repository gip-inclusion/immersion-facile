import { decode, TokenExpiredError } from "jsonwebtoken";
import {
  type AppSupportedDomainJwtPayload,
  type AppSupportedJwt,
  type ConnectedUserDomainJwtPayload,
  type ConventionDomainJwtPayload,
  errors,
  ForbiddenError,
  frontRoutes,
  type MagicLinkRenewalParams,
  type OAuthState,
  type RenewExpiredJwtRequestDto,
  renewExpiredJwtRequestSchema,
} from "shared";
import type { AppConfig } from "../../../../../config/bootstrap/appConfig";
import { verifyJwtConfig } from "../../../../../config/bootstrap/authMiddleware";
import type {
  GenerateConnectedUserLoginUrl,
  GenerateConventionMagicLinkUrl,
  GenerateEmailAuthCodeUrl,
} from "../../../../../config/bootstrap/magicLinkUrl";
import {
  conventionDtoToConventionReadDto,
  conventionEmailsByRole,
} from "../../../../../utils/convention";
import { makeEmailHash } from "../../../../../utils/jwt";
import type { SaveNotificationAndRelatedEvent } from "../../../notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../../short-link/ports/ShortLinkIdGeneratorGateway";
import {
  prepareConnectedUserMagicShortLinkMaker,
  prepareConventionMagicShortLinkMaker,
  prepareEmailAuthCodeShortLinkMaker,
} from "../../../short-link/ShortLink";
import type { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../../UseCase";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";

export class RenewExpiredJwt extends TransactionalUseCase<
  RenewExpiredJwtRequestDto,
  void
> {
  protected inputSchema = renewExpiredJwtRequestSchema;

  readonly #makeGenerateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  readonly #makeGenerateConnectedUserLoginUrl: GenerateConnectedUserLoginUrl;
  readonly #makeGenerateEmailAuthCodeUrl: GenerateEmailAuthCodeUrl;

  readonly #config: AppConfig;

  readonly #timeGateway: TimeGateway;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor({
    uowPerformer,
    makeGenerateConventionMagicLinkUrl,
    makeGenerateConnectedUserLoginUrl,
    makeGenerateEmailAuthCodeUrl,
    config,
    timeGateway,
    shortLinkIdGeneratorGateway,
    saveNotificationAndRelatedEvent,
  }: {
    uowPerformer: UnitOfWorkPerformer;
    makeGenerateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
    makeGenerateConnectedUserLoginUrl: GenerateConnectedUserLoginUrl;
    makeGenerateEmailAuthCodeUrl: GenerateEmailAuthCodeUrl;
    config: AppConfig;
    timeGateway: TimeGateway;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  }) {
    super(uowPerformer);
    this.#config = config;
    this.#makeGenerateConventionMagicLinkUrl =
      makeGenerateConventionMagicLinkUrl;
    this.#makeGenerateConnectedUserLoginUrl = makeGenerateConnectedUserLoginUrl;
    this.#makeGenerateEmailAuthCodeUrl = makeGenerateEmailAuthCodeUrl;
    this.#timeGateway = timeGateway;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(input: RenewExpiredJwtRequestDto, uow: UnitOfWork) {
    const appSupportedJwtPayload = extractJwtPayloadFromExpiredJwt(
      this.#config,
      input.expiredJwt,
    );

    if ("applicationId" in appSupportedJwtPayload && "originalUrl" in input)
      return this.onConventionDomainJwtPayload(
        uow,
        appSupportedJwtPayload,
        input.originalUrl,
      );

    if ("emailAuthCode" in appSupportedJwtPayload && "state" in input) {
      // à partir d'un jwt emailAuthCode, un utilisateur peut piffer des states ids : faille de sécu ?
      return this.#onEmailAuthCodeDomainJwtPayload(uow, input.state);
    }

    if ("userId" in appSupportedJwtPayload)
      return this.#onConnectedUserDomainJwtPayload(uow, appSupportedJwtPayload);

    throw errors.user.unsupportedJwtPayload();
  }

  async #onEmailAuthCodeDomainJwtPayload(
    uow: UnitOfWork,
    state: OAuthState,
  ): Promise<void> {
    const ongoingOAuth = await uow.ongoingOAuthRepository.findByState(state);

    if (!ongoingOAuth) throw errors.auth.missingOAuth({ state });
    if (ongoingOAuth.usedAt) throw errors.auth.alreadyUsedAuthentication();
    if (ongoingOAuth.provider !== "email")
      throw errors.auth.otherRenewalNotSupported(ongoingOAuth.provider);

    return this.#sendTokenRenewal(uow, ongoingOAuth.email, {
      magicLink: await prepareEmailAuthCodeShortLinkMaker({
        uow,
        config: this.#config,
        generateEmailAuthCodeLoginUrl: this.#makeGenerateEmailAuthCodeUrl,
        shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      })({
        email: ongoingOAuth.email,
        now: this.#timeGateway.now(),
        state: ongoingOAuth.state,
        uri: frontRoutes.magicLinkInterstitial,
      }),
    });
  }

  async #onConnectedUserDomainJwtPayload(
    uow: UnitOfWork,
    { userId }: ConnectedUserDomainJwtPayload,
  ): Promise<void> {
    const user = await uow.userRepository.getById(userId);

    if (!user) throw errors.user.notFound({ userId });

    const ongoingOAuth = await uow.ongoingOAuthRepository.findByUserId(user.id);

    if (!ongoingOAuth) throw errors.auth.missingOAuth({});
    if (!ongoingOAuth.usedAt) throw errors.auth.unusedOAuth();
    if (ongoingOAuth.provider !== "email")
      throw errors.auth.otherRenewalNotSupported(ongoingOAuth.provider);

    await this.#sendTokenRenewal(uow, user.email, {
      magicLink: await prepareConnectedUserMagicShortLinkMaker({
        uow,
        config: this.#config,
        shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
        generateConnectedUserLoginUrl: this.#makeGenerateConnectedUserLoginUrl,
      })({
        user,
        accessToken: undefined,
        ongoingOAuth,
        now: this.#timeGateway.now(),
      }),
    });
  }

  private async onConventionDomainJwtPayload(
    uow: UnitOfWork,
    conventionJwt: ConventionDomainJwtPayload,
    originalUrl: string,
  ): Promise<void> {
    const convention = await uow.conventionRepository.getById(
      conventionJwt.applicationId,
    );
    if (!convention)
      throw errors.convention.notFound({
        conventionId: conventionJwt.applicationId,
      });

    const emails = conventionEmailsByRole(
      await conventionDtoToConventionReadDto(convention, uow),
    )(conventionJwt.role);

    const emailMatchingEmailHash = emails.find(
      (email) => makeEmailHash(email) === conventionJwt.emailHash,
    );

    if (!emailMatchingEmailHash)
      throw errors.convention.magicLinkNotAssociatedToConvention();

    const makeConventionMagicShortLink = prepareConventionMagicShortLinkMaker({
      uow,
      config: this.#config,
      generateConventionMagicLinkUrl: this.#makeGenerateConventionMagicLinkUrl,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      conventionMagicLinkPayload: {
        id: convention.id,
        role: conventionJwt.role,
        email: emailMatchingEmailHash,
        now: this.#timeGateway.now(),
      },
    });

    await this.#sendTokenRenewal(uow, emailMatchingEmailHash, {
      internshipKind: convention.internshipKind,
      magicLink: await makeConventionMagicShortLink({
        targetRoute: this.#findRouteToRenew(originalUrl),
        lifetime: "short",
        singleUse: false,
      }),
      conventionId: convention.id,
    });
  }

  async #sendTokenRenewal(
    uow: UnitOfWork,
    email: string,
    params: MagicLinkRenewalParams,
  ): Promise<void> {
    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "MAGIC_LINK_RENEWAL",
        recipients: [email],
        params,
      },
      followedIds: {
        conventionId: params.conventionId,
      },
    });
  }

  #findRouteToRenew(originalUrl: string) {
    const supportedRenewRoutes: string[] = [
      frontRoutes.conventionImmersionRoute,
      frontRoutes.conventionToSign,
      frontRoutes.manageConvention,
      frontRoutes.assessment,
      frontRoutes.assessmentDocument,
    ];

    const supportedRouteToRenew = supportedRenewRoutes.find((supportedRoute) =>
      decodeURIComponent(originalUrl).includes(`/${supportedRoute}`),
    );

    if (!supportedRouteToRenew)
      throw errors.convention.unsupportedRenewRoute({
        supportedRenewRoutes,
        originalUrl,
      });
    return supportedRouteToRenew;
  }
}

const extractJwtPayloadFromExpiredJwt = (
  config: AppConfig,
  expiredJwt: AppSupportedJwt,
): AppSupportedDomainJwtPayload => {
  const { verifyJwt, verifyDeprecatedJwt } = verifyJwtConfig(config);
  let payloadToExtract: AppSupportedDomainJwtPayload | undefined;
  try {
    // If the following doesn't throw, we're dealing with a JWT that we signed, so it's
    // probably expired or an old version.
    payloadToExtract = verifyJwt(expiredJwt) as AppSupportedDomainJwtPayload;
  } catch (err) {
    // If this JWT is signed by us but expired, deal with it.
    if (err instanceof TokenExpiredError) {
      payloadToExtract = decode(expiredJwt) as AppSupportedDomainJwtPayload;
    } else {
      // Perhaps this is a JWT that is signed by a compromised key.
      try {
        verifyDeprecatedJwt(expiredJwt);
        // If the above didn't throw, this is a JWT that we issued. Renew it.
        // However, we cannot trust the contents of it, as the private key was potentially
        // compromised. Therefore, only use the convention ID and the role from it, and fill
        // the remaining data from the database to prevent a hacker from getting magic links
        // for any convention form.
        payloadToExtract = decode(expiredJwt) as AppSupportedDomainJwtPayload;
      } catch (_) {
        // We don't want to renew this JWT.
        throw new ForbiddenError();
      }
    }
  }
  // Convention JWT payload is not validated
  if (payloadToExtract) return payloadToExtract;
  throw errors.convention.malformedExpiredJwt();
};
