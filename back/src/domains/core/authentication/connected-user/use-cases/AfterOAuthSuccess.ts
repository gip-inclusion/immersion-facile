import {
  type AbsoluteUrl,
  type AfterOAuthSuccessRedirectionResponse,
  type ConventionDraftDto,
  errors,
  executeInSequence,
  frontRoutes,
  makeRouteAbsoluteUrl,
  type OAuthSuccessLoginParams,
  oAuthSuccessLoginParamsSchema,
  type UserId,
  type UserWithAdminRights,
} from "shared";
import { match } from "ts-pattern";
import type { GenerateConnectedUserLoginUrl } from "../../../../../config/bootstrap/magicLinkUrl";
import { makeThrowIfIncorrectJwt } from "../../../../../utils/jwt";
import {
  type AgencyRightOfUser,
  removeAgencyRightsForUser,
  updateAgencyRightsForUser,
} from "../../../../agency/ports/AgencyRepository";
import type { CreateNewEvent } from "../../../events/ports/EventBus";
import type { VerifyJwtFn } from "../../../jwt";
import type { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../../UseCase";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";
import { chooseValidAdvisor } from "../../ft-connect/entities/ConventionFranceTravailAdvisorEntity";
import type { FtConnectGateway } from "../../ft-connect/port/FtConnectGateway";
import type {
  EmailOngoingAuth,
  FTConnectOngoingAuth,
  ProConnectOngoingAuth,
} from "../entities/OngoingOAuth";
import type {
  GetAccessTokenResult,
  OAuthGateway,
  ProConnectGetAccessTokenPayload,
} from "../port/OAuthGateway";

export class AfterOAuthSuccess extends TransactionalUseCase<
  OAuthSuccessLoginParams,
  AfterOAuthSuccessRedirectionResponse
> {
  protected inputSchema = oAuthSuccessLoginParamsSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #oAuthGateway: OAuthGateway;

  readonly #uuidGenerator: UuidGenerator;

  readonly #generateConnectedUserLoginUrl: GenerateConnectedUserLoginUrl;

  readonly #ftConnectGateway: FtConnectGateway;

  readonly #immersionFacileBaseUrl: AbsoluteUrl;

  readonly #timeGateway: TimeGateway;

  #throwIfIncorrectJwt: (jwt: string) => void;

  constructor({
    uowPerformer,
    createNewEvent,
    proConnectOAuthGateway: oAuthGateway,
    uuidGenerator,
    ftConnectGateway,
    generateConnectedUserLoginUrl,
    verifyEmailAuthCodeJwt,
    immersionFacileBaseUrl,
    timeGateway,
  }: {
    uowPerformer: UnitOfWorkPerformer;
    createNewEvent: CreateNewEvent;
    proConnectOAuthGateway: OAuthGateway;
    ftConnectGateway: FtConnectGateway;
    uuidGenerator: UuidGenerator;
    generateConnectedUserLoginUrl: GenerateConnectedUserLoginUrl;
    verifyEmailAuthCodeJwt: VerifyJwtFn<"emailAuthCode">;
    immersionFacileBaseUrl: AbsoluteUrl;
    timeGateway: TimeGateway;
  }) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#oAuthGateway = oAuthGateway;
    this.#ftConnectGateway = ftConnectGateway;
    this.#uuidGenerator = uuidGenerator;
    this.#generateConnectedUserLoginUrl = generateConnectedUserLoginUrl;
    this.#immersionFacileBaseUrl = immersionFacileBaseUrl;
    this.#timeGateway = timeGateway;
    this.#throwIfIncorrectJwt = makeThrowIfIncorrectJwt(
      verifyEmailAuthCodeJwt,
      timeGateway,
    );
  }

  protected async _execute(
    { code, state }: OAuthSuccessLoginParams,
    uow: UnitOfWork,
  ): Promise<AfterOAuthSuccessRedirectionResponse> {
    const ongoingOAuth = await uow.ongoingOAuthRepository.findByState(state);
    if (!ongoingOAuth) throw errors.auth.missingOAuth({ state });

    return match(ongoingOAuth)
      .with({ provider: "email" }, async (emailOauth: EmailOngoingAuth) => {
        if (emailOauth.usedAt) throw errors.auth.alreadyUsedAuthentication();
        return this.#saveEmailAuthenticationDataAndReturnRedirectURI({
          uow,
          ...(await this.#onEmailProvider(uow, emailOauth, code)),
        });
      })
      .with(
        { provider: "proConnect" },
        async (proConnectOngoingOAuth: ProConnectOngoingAuth) => {
          if (ongoingOAuth.usedAt) {
            return {
              provider: ongoingOAuth.provider,
              redirectUri:
                `${this.#immersionFacileBaseUrl}${ongoingOAuth.fromUri}?alreadyUsedAuthentication=true` satisfies AbsoluteUrl,
            };
          }
          return this.#saveProConnectAuthenticationDataAndReturnRedirectURI({
            uow,
            ...(await this.#onProConnectProvider(
              uow,
              proConnectOngoingOAuth,
              code,
            )),
          });
        },
      )
      .with(
        { provider: "peConnect" },
        async (ftConnectOngoinOAuth: FTConnectOngoingAuth) => {
          return this.#saveFTConnectAuthenticationDataAndReturnRedirectURI({
            uow,
            ...(await this.#onFTConnectProvider(ftConnectOngoinOAuth, code)),
          });
        },
      )
      .exhaustive();
  }

  async #saveEmailAuthenticationDataAndReturnRedirectURI({
    uow,
    newOrUpdatedUser,
    updatedOngoingOAuth,
  }: {
    uow: UnitOfWork;
    newOrUpdatedUser: UserWithAdminRights;
    updatedOngoingOAuth: EmailOngoingAuth;
  }): Promise<AfterOAuthSuccessRedirectionResponse> {
    await uow.userRepository.save({
      ...newOrUpdatedUser,
      lastLoginAt: this.#timeGateway.now().toISOString(),
    });
    await uow.ongoingOAuthRepository.save(updatedOngoingOAuth);

    return {
      provider: updatedOngoingOAuth.provider,
      redirectUri: this.#generateConnectedUserLoginUrl({
        user: newOrUpdatedUser,
        ongoingOAuth: updatedOngoingOAuth,
        now: this.#timeGateway.now(),
        accessToken: undefined,
      }),
    };
  }

  async #saveProConnectAuthenticationDataAndReturnRedirectURI({
    uow,
    newOrUpdatedUser,
    updatedOngoingOAuth,
    accessToken,
  }: {
    uow: UnitOfWork;
    newOrUpdatedUser: UserWithAdminRights;
    updatedOngoingOAuth: ProConnectOngoingAuth;
    accessToken: GetAccessTokenResult;
  }): Promise<AfterOAuthSuccessRedirectionResponse> {
    await uow.userRepository.save({
      ...newOrUpdatedUser,
      lastLoginAt: this.#timeGateway.now().toISOString(),
    });
    await uow.ongoingOAuthRepository.save(updatedOngoingOAuth);
    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "UserAuthenticatedSuccessfully",
        payload: {
          userId: newOrUpdatedUser.id,
          codeSafir:
            accessToken &&
            "structure_pe" in accessToken.payload &&
            accessToken.payload.structure_pe
              ? accessToken.payload.structure_pe
              : null,
          triggeredBy: {
            kind: "connected-user",
            userId: newOrUpdatedUser.id,
          },
        },
      }),
    );
    return {
      provider: updatedOngoingOAuth.provider,
      redirectUri: this.#generateConnectedUserLoginUrl({
        user: newOrUpdatedUser,
        accessToken,
        ongoingOAuth: updatedOngoingOAuth,
        now: this.#timeGateway.now(),
      }),
    };
  }

  async #saveFTConnectAuthenticationDataAndReturnRedirectURI({
    uow,
    updatedOngoingOAuth,
    accessToken,
  }: {
    uow: UnitOfWork;
    updatedOngoingOAuth: FTConnectOngoingAuth;
    accessToken: GetAccessTokenResult;
  }): Promise<AfterOAuthSuccessRedirectionResponse> {
    await uow.ongoingOAuthRepository.save(updatedOngoingOAuth);
    const userAndAdvisors = await this.#ftConnectGateway.getUserAndAdvisors({
      value: accessToken.accessToken,
      expiresIn: accessToken.expire,
      idToken: accessToken.idToken,
    });
    if (!userAndAdvisors) {
      return {
        provider: updatedOngoingOAuth.provider,
        redirectUri: makeRouteAbsoluteUrl({
          route: frontRoutes.conventionImmersion(),
          baseUrl: this.#immersionFacileBaseUrl,
        }),
      };
    }
    const validAdvisor = userAndAdvisors.user.isJobseeker
      ? chooseValidAdvisor(userAndAdvisors.user, userAndAdvisors.advisors)
      : undefined;

    await uow.conventionFranceTravailAdvisorRepository.saveFtUserAndAdvisor({
      advisor: validAdvisor,
      user: userAndAdvisors.user,
    });

    const conventionDraft: ConventionDraftDto = {
      id: this.#uuidGenerator.new(),
      internshipKind: "immersion",
      fromPeConnectedUser: true,
      signatories: {
        beneficiary: {
          birthdate: userAndAdvisors.user.birthdate,
          email: userAndAdvisors.user.email,
          firstName: userAndAdvisors.user.firstName,
          lastName: userAndAdvisors.user.lastName,
          phone: userAndAdvisors.user.phone,
          federatedIdentity: {
            provider: "peConnect",
            token: userAndAdvisors.user.peExternalId,
          },
        },
      },
      validators: validAdvisor
        ? {
            agencyCounsellor: {
              firstname: validAdvisor.firstName,
              lastname: validAdvisor.lastName,
            },
          }
        : undefined,
    };
    await uow.conventionDraftRepository.save(
      conventionDraft,
      this.#timeGateway.now().toISOString(),
    );

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "FTConnectedSuccessfully",
        payload: {
          ftConnectUserId: userAndAdvisors.user.peExternalId,
          conventionDraftId: conventionDraft.id,
        },
      }),
    );
    return {
      provider: updatedOngoingOAuth.provider,
      redirectUri:
        `${this.#immersionFacileBaseUrl}${updatedOngoingOAuth.fromUri}?conventionDraftId=${conventionDraft.id}` satisfies AbsoluteUrl,
    };
  }

  async #onProConnectProvider(
    uow: UnitOfWork,
    ongoingOAuth: ProConnectOngoingAuth,
    code: string,
  ): Promise<{
    newOrUpdatedUser: UserWithAdminRights;
    updatedOngoingOAuth: ProConnectOngoingAuth;
    accessToken: GetAccessTokenResult;
  }> {
    const accessToken = await this.#oAuthGateway.getAccessToken({
      code,
    });

    if (accessToken.type !== "proConnect")
      throw errors.auth.accessTokenErrorType({
        actualType: "peConnect",
        expectedType: "proConnect",
      });

    if (accessToken.payload.nonce !== ongoingOAuth.nonce)
      throw errors.auth.nonceMismatch();

    const newOrUpdatedUser = await this.#makeNewOrUpdatedProConnectedUser(
      uow,
      accessToken.payload,
    );

    return {
      newOrUpdatedUser,
      updatedOngoingOAuth: {
        ...ongoingOAuth,
        userId: newOrUpdatedUser.id,
        usedAt: this.#timeGateway.now(),
        externalId: newOrUpdatedUser.proConnect?.externalId,
        accessToken: accessToken.accessToken,
        idToken: accessToken.idToken,
      },
      accessToken,
    };
  }

  async #onFTConnectProvider(
    ongoingOAuth: FTConnectOngoingAuth,
    code: string,
  ): Promise<{
    updatedOngoingOAuth: FTConnectOngoingAuth;
    accessToken: GetAccessTokenResult;
  }> {
    const accessToken = await this.#ftConnectGateway.getAccessToken({
      code,
    });

    if (accessToken.payload.nonce !== ongoingOAuth.nonce)
      throw errors.auth.nonceMismatch();

    return {
      updatedOngoingOAuth: {
        ...ongoingOAuth,
        usedAt: this.#timeGateway.now(),
        accessToken: accessToken.accessToken,
        idToken: accessToken.idToken,
      },
      accessToken,
    };
  }

  async #onEmailProvider(
    uow: UnitOfWork,
    ongoingOAuth: EmailOngoingAuth,
    code: string,
  ): Promise<{
    newOrUpdatedUser: UserWithAdminRights;
    updatedOngoingOAuth: EmailOngoingAuth;
  }> {
    this.#throwIfIncorrectJwt(code);

    const existingUser = await uow.userRepository.findByEmail(
      ongoingOAuth.email,
    );

    const newOrUpdatedUser = existingUser ?? {
      id: this.#uuidGenerator.new(),
      createdAt: this.#timeGateway.now().toISOString(),
      email: ongoingOAuth.email,
      firstName: "",
      lastName: "",
      proConnect: null,
    };

    return {
      newOrUpdatedUser: newOrUpdatedUser,
      updatedOngoingOAuth: {
        ...ongoingOAuth,
        userId: newOrUpdatedUser.id,
        usedAt: this.#timeGateway.now(),
      },
    };
  }

  async #makeNewOrUpdatedProConnectedUser(
    uow: UnitOfWork,
    payload: ProConnectGetAccessTokenPayload,
  ): Promise<UserWithAdminRights> {
    const existingUserByExternalId =
      "sub" in payload
        ? await uow.userRepository.findByExternalId(payload.sub)
        : undefined;

    const existingUserByEmail = await uow.userRepository.findByEmail(
      payload.email,
    );

    const conflictingUserFound =
      existingUserByEmail &&
      existingUserByExternalId &&
      existingUserByEmail.id !== existingUserByExternalId.id;

    if (conflictingUserFound) {
      await this.#resolveConflictingUsers({
        uow,
        userToKeepId: existingUserByExternalId.id,
        userToDeleteId: existingUserByEmail.id,
      });
    }

    return {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      proConnect: {
        externalId: payload.sub,
        siret: payload.siret,
      },
      id:
        existingUserByExternalId?.id ||
        existingUserByEmail?.id ||
        this.#uuidGenerator.new(),
      createdAt:
        existingUserByExternalId?.createdAt ||
        existingUserByEmail?.createdAt ||
        this.#timeGateway.now().toISOString(),
    };
  }

  async #resolveConflictingUsers({
    uow,
    userToKeepId,
    userToDeleteId,
  }: {
    uow: UnitOfWork;
    userToKeepId: UserId;
    userToDeleteId: UserId;
  }): Promise<void> {
    const userToDeleteAgencyRights =
      await uow.agencyRepository.getAgenciesRightsByUserId(userToDeleteId);
    const userToKeepAgencyRights =
      await uow.agencyRepository.getAgenciesRightsByUserId(userToKeepId);

    const newAgenciesRightForUser = userToDeleteAgencyRights.reduce<
      AgencyRightOfUser[]
    >((acc, userToDeleteAgencyRight) => {
      const existingUserToKeepAgencyRight = userToKeepAgencyRights.find(
        (newAgencyRight) =>
          newAgencyRight.agencyId === userToDeleteAgencyRight.agencyId,
      );

      return [
        ...acc,
        {
          agencyId: userToDeleteAgencyRight.agencyId,
          isNotifiedByEmail:
            existingUserToKeepAgencyRight?.isNotifiedByEmail ||
            userToDeleteAgencyRight.isNotifiedByEmail,
          roles: [
            ...(existingUserToKeepAgencyRight?.roles || []),
            ...userToDeleteAgencyRight.roles,
          ],
        },
      ];
    }, []);

    await executeInSequence(newAgenciesRightForUser, (agencyRightsForUser) =>
      updateAgencyRightsForUser(uow, userToKeepId, agencyRightsForUser),
    );

    await executeInSequence(userToDeleteAgencyRights, (agencyRightsForUser) =>
      removeAgencyRightsForUser(uow, userToDeleteId, agencyRightsForUser),
    );

    await uow.userRepository.delete(userToDeleteId);
  }
}
