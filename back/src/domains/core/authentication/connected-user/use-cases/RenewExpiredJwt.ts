import { decode, TokenExpiredError } from "jsonwebtoken";
import { keys, values } from "ramda";
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
  removeAllParamsFromUrl,
  renewExpiredJwtRequestSchema,
  type ShortLinkId,
} from "shared";
import type { AppConfig } from "../../../../../config/bootstrap/appConfig";
import { verifyJwtConfig } from "../../../../../config/bootstrap/authMiddleware";
import type {
  GenerateConnectedUserLoginUrl,
  GenerateConventionMagicLinkRouteName,
  GenerateConventionMagicLinkUrl,
  GenerateEmailAuthCodeUrl,
} from "../../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../../utils/agency";
import { conventionEmailsByRole } from "../../../../../utils/convention";
import { makeEmailHash } from "../../../../../utils/jwt";
import { retrieveConventionWithAgency } from "../../../../convention/entities/Convention";
import type { CreateNewEvent } from "../../../events/ports/EventBus";
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

  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  readonly #generateConnectedUserLoginUrl: GenerateConnectedUserLoginUrl;
  readonly #generateEmailAuthCodeUrl: GenerateEmailAuthCodeUrl;

  readonly #config: AppConfig;

  readonly #timeGateway: TimeGateway;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  readonly #createNewEvent: CreateNewEvent;

  constructor({
    uowPerformer,
    generateConventionMagicLinkUrl,
    generateConnectedUserLoginUrl,
    generateEmailAuthCodeUrl,
    config,
    timeGateway,
    shortLinkIdGeneratorGateway,
    saveNotificationAndRelatedEvent,
    createNewEvent,
  }: {
    uowPerformer: UnitOfWorkPerformer;
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
    generateConnectedUserLoginUrl: GenerateConnectedUserLoginUrl;
    generateEmailAuthCodeUrl: GenerateEmailAuthCodeUrl;
    config: AppConfig;
    timeGateway: TimeGateway;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    createNewEvent: CreateNewEvent;
  }) {
    super(uowPerformer);
    this.#config = config;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
    this.#generateConnectedUserLoginUrl = generateConnectedUserLoginUrl;
    this.#generateEmailAuthCodeUrl = generateEmailAuthCodeUrl;
    this.#timeGateway = timeGateway;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(input: RenewExpiredJwtRequestDto, uow: UnitOfWork) {
    if (input.kind === "conventionFromShortLink")
      return this.#onConventionFromShortLink(
        uow,
        input.shortLinkId,
        input.expiredJwt,
      );

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

  async #onConventionFromShortLink(
    uow: UnitOfWork,
    shortLinkId: ShortLinkId,
    expiredJwt: string,
  ): Promise<void> {
    const shortLink = await uow.shortLinkQuery.getById(shortLinkId);
    if (!shortLink) throw errors.shortLink.notFound({ shortLinkId });
    const appSupportedJwtPayload = extractJwtPayloadFromExpiredJwt(
      this.#config,
      expiredJwt,
    );
    if (!("applicationId" in appSupportedJwtPayload))
      throw errors.user.unsupportedJwtPayload();
    return this.onConventionDomainJwtPayload(
      uow,
      appSupportedJwtPayload,
      shortLink.url,
    );
  }

  async #onEmailAuthCodeDomainJwtPayload(
    uow: UnitOfWork,
    state: OAuthState,
  ): Promise<void> {
    const ongoingOAuth = await uow.ongoingOAuthRepository.findByState(state);

    if (!ongoingOAuth) throw errors.auth.missingOAuth({ state });
    if (ongoingOAuth.provider !== "email")
      throw errors.auth.otherRenewalNotSupported(ongoingOAuth.provider);

    return ongoingOAuth.usedAt
      ? uow.outboxRepository.save(
          this.#createNewEvent({
            topic: "UserAuthenticationByEmailRequested",
            payload: {
              email: ongoingOAuth.email,
              redirectUri: ongoingOAuth.fromUri,
            },
          }),
        )
      : this.#sendTokenRenewal(uow, ongoingOAuth.email, {
          magicLink: await prepareEmailAuthCodeShortLinkMaker({
            uow,
            config: this.#config,
            generateEmailAuthCodeLoginUrl: this.#generateEmailAuthCodeUrl,
            shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
          })({
            email: ongoingOAuth.email,
            now: this.#timeGateway.now(),
            state: ongoingOAuth.state,
            targetRoute: "magicLinkInterstitial",
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
        generateConnectedUserLoginUrl: this.#generateConnectedUserLoginUrl,
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
    const { agency, convention } = await retrieveConventionWithAgency(
      uow,
      conventionJwt.applicationId,
    );

    const emails = conventionEmailsByRole(
      convention,
      await agencyWithRightToAgencyDto(uow, agency),
    )(conventionJwt.role);

    const emailMatchingEmailHash = emails.find(
      (email) => makeEmailHash(email) === conventionJwt.emailHash,
    );

    if (!emailMatchingEmailHash)
      throw errors.convention.magicLinkNotAssociatedToConvention();

    const makeConventionMagicShortLink = prepareConventionMagicShortLinkMaker({
      uow,
      config: this.#config,
      generateConventionMagicLinkUrl: this.#generateConventionMagicLinkUrl,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      conventionMagicLinkPayload: {
        id: convention.id,
        role: conventionJwt.role,
        email: emailMatchingEmailHash,
        now: this.#timeGateway.now(),
      },
    });

    const routeToRenew: GenerateConventionMagicLinkRouteName =
      this.#findRouteToRenew(originalUrl);

    await this.#sendTokenRenewal(uow, emailMatchingEmailHash, {
      internshipKind: convention.internshipKind,
      magicLink: await makeConventionMagicShortLink({
        targetRoute: routeToRenew,
        lifetime: "1Month",
      }),
      conventionId: convention.id,
    });
  }

  async #sendTokenRenewal(
    uow: UnitOfWork,
    email: string,
    params: MagicLinkRenewalParams,
  ): Promise<void> {
    await this.#saveNotificationAndRelatedEvent(
      uow,
      {
        kind: "email",
        templatedContent: {
          kind: "MAGIC_LINK_RENEWAL",
          recipients: [email],
          params,
        },
        followedIds: {
          conventionId: params.conventionId,
        },
      },
      { priority: 2 },
    );
  }

  #findRouteToRenew(originalUrl: string): GenerateConventionMagicLinkRouteName {
    const supportedRenewRoutesByRouteName: Record<
      GenerateConventionMagicLinkRouteName,
      string
    > = {
      conventionToSign: frontRoutes.conventionToSign({ jwt: "" }).href,
      manageConvention: frontRoutes.manageConvention({ jwt: "" }).href,
      assessment: frontRoutes.assessment({ jwt: "" }).href,
      assessmentDocument: frontRoutes.assessmentDocument({ jwt: "" }).href,
      conventionImmersion: frontRoutes.conventionImmersion({ jwt: "" }).href,
      unregisterEstablishmentLead: frontRoutes.unregisterEstablishmentLead({
        jwt: "",
      }).href,
      conventionDocument: frontRoutes.conventionDocument({ jwt: "" }).href,
    };

    const supportedRouteToRenew = keys(supportedRenewRoutesByRouteName).find(
      (routeName) =>
        decodeURIComponent(originalUrl).includes(
          removeAllParamsFromUrl(supportedRenewRoutesByRouteName[routeName]),
        ),
    );

    if (!supportedRouteToRenew)
      throw errors.convention.unsupportedRenewRoute({
        supportedRenewRoutes: values(supportedRenewRoutesByRouteName),
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
