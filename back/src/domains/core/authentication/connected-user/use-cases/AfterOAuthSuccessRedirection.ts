import {
  type AbsoluteUrl,
  type AlreadyAuthenticatedUserQueryParams,
  type ConnectedUserQueryParams,
  currentJwtVersions,
  decodeURIWithParams,
  type EmailAuthCodeJwt,
  errors,
  type OAuthCode,
  type OAuthSuccessLoginParams,
  oAuthSuccessLoginParamsSchema,
  queryParamsAsString,
  TWELVE_HOURS_IN_SECONDS,
  type UserId,
  type UserWithAdminRights,
} from "shared";
import { makeThrowIfIncorrectJwt } from "../../../../../utils/jwt";
import {
  type AgencyRightOfUser,
  removeAgencyRightsForUser,
  updateAgencyRightsForUser,
} from "../../../../agency/ports/AgencyRepository";
import type { CreateNewEvent } from "../../../events/ports/EventBus";
import type { GenerateConnectedUserJwt, VerifyJwtFn } from "../../../jwt";
import type { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../../UseCase";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";
import type {
  EmailOngoingAuth,
  OngoingOAuth,
  ProConnectOngoingAuth,
} from "../entities/OngoingOAuth";
import type {
  GetAccessTokenPayload,
  GetAccessTokenResult,
  OAuthGateway,
} from "../port/OAuthGateway";

type ConnectedRedirectUrl = AbsoluteUrl;

export class AfterOAuthSuccessRedirection extends TransactionalUseCase<
  OAuthSuccessLoginParams,
  ConnectedRedirectUrl
> {
  protected inputSchema = oAuthSuccessLoginParamsSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #oAuthGateway: OAuthGateway;

  readonly #uuidGenerator: UuidGenerator;

  readonly #generateConnectedUserJwt: GenerateConnectedUserJwt;

  readonly #immersionFacileBaseUrl: AbsoluteUrl;

  readonly #timeGateway: TimeGateway;

  #throwIfIncorrectJwt: (jwt: string) => void;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    oAuthGateway: OAuthGateway,
    uuidGenerator: UuidGenerator,
    generateConnectedUserJwt: GenerateConnectedUserJwt,
    verifyEmailAuthCodeJwt: VerifyJwtFn<"emailAuthCode">,
    immersionFacileBaseUrl: AbsoluteUrl,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#oAuthGateway = oAuthGateway;
    this.#uuidGenerator = uuidGenerator;
    this.#generateConnectedUserJwt = generateConnectedUserJwt;
    this.#immersionFacileBaseUrl = immersionFacileBaseUrl;
    this.#timeGateway = timeGateway;
    this.#throwIfIncorrectJwt = makeThrowIfIncorrectJwt(verifyEmailAuthCodeJwt);
  }

  protected async _execute(
    { code, state }: OAuthSuccessLoginParams,
    uow: UnitOfWork,
  ): Promise<ConnectedRedirectUrl> {
    const ongoingOAuth = await uow.ongoingOAuthRepository.findByState(state);

    if (!ongoingOAuth)
      throw errors.proConnect.missingOAuth({
        state,
      });

    const { uriWithoutParams, params } = decodeURIWithParams(
      ongoingOAuth.fromUri,
    );

    if (ongoingOAuth.usedAt)
      return `${this.#immersionFacileBaseUrl}${
        uriWithoutParams
      }?${queryParamsAsString<AlreadyAuthenticatedUserQueryParams>({
        alreadyUsedAuthentication: true,
      })}`;

    const { newOrUpdatedUser, accessToken } = await (ongoingOAuth.provider ===
    "email"
      ? this.#onEmailProvider(uow, ongoingOAuth, code as EmailAuthCodeJwt)
      : this.#onProConnectProvider(uow, ongoingOAuth, code));

    const updatedOnGoingAuth: OngoingOAuth = {
      ...ongoingOAuth,
      userId: newOrUpdatedUser.id,
      usedAt: this.#timeGateway.now(),
      ...(ongoingOAuth.provider === "proConnect"
        ? {
            externalId: newOrUpdatedUser.proConnect?.externalId,
            accessToken: accessToken?.accessToken,
          }
        : {}),
      ...(ongoingOAuth.provider === "email"
        ? { email: ongoingOAuth.email }
        : {}),
    };

    await Promise.all([
      uow.userRepository.save({
        ...newOrUpdatedUser,
        lastLoginAt: this.#timeGateway.now().toISOString(),
      }),
      uow.ongoingOAuthRepository.save(updatedOnGoingAuth),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "UserAuthenticatedSuccessfully",
          payload: {
            userId: newOrUpdatedUser.id,
            codeSafir: accessToken?.payload.structure_pe ?? null,
            triggeredBy: {
              kind: "connected-user",
              userId: newOrUpdatedUser.id,
            },
          },
        }),
      ),
    ]);

    return `${this.#immersionFacileBaseUrl}${
      uriWithoutParams
    }?${queryParamsAsString<ConnectedUserQueryParams>({
      ...params,
      token: this.#generateConnectedUserJwt(
        {
          userId: newOrUpdatedUser.id,
          version: currentJwtVersions.connectedUser,
        },
        TWELVE_HOURS_IN_SECONDS,
      ),
      firstName: newOrUpdatedUser.firstName,
      lastName: newOrUpdatedUser.lastName,
      email: newOrUpdatedUser.email,
      idToken: accessToken?.idToken ?? "",
      provider: ongoingOAuth.provider,
    })}`;
  }

  async #onProConnectProvider(
    uow: UnitOfWork,
    ongoingOAuth: ProConnectOngoingAuth,
    code: EmailAuthCodeJwt | OAuthCode,
  ): Promise<{
    newOrUpdatedUser: UserWithAdminRights;
    accessToken?: GetAccessTokenResult;
  }> {
    const accessToken = await this.#oAuthGateway.getAccessToken({
      code,
    });

    if (accessToken.payload.nonce !== ongoingOAuth.nonce)
      throw errors.proConnect.nonceMismatch();

    return {
      newOrUpdatedUser: await this.#makeNewOrUpdatedProConnectedUser(
        uow,
        accessToken.payload,
      ),
      accessToken,
    };
  }

  async #onEmailProvider(
    uow: UnitOfWork,
    ongoingOAuth: EmailOngoingAuth,
    code: EmailAuthCodeJwt,
  ): Promise<{
    newOrUpdatedUser: UserWithAdminRights;
    accessToken?: GetAccessTokenResult;
  }> {
    this.#throwIfIncorrectJwt(code);

    const existingUser = await uow.userRepository.findByEmail(
      ongoingOAuth.email,
    );

    return {
      newOrUpdatedUser: existingUser ?? {
        id: this.#uuidGenerator.new(),
        createdAt: this.#timeGateway.now().toISOString(),
        email: ongoingOAuth.email,
        firstName: "",
        lastName: "",
        proConnect: null,
      },
    };
  }

  async #makeNewOrUpdatedProConnectedUser(
    uow: UnitOfWork,
    payload: GetAccessTokenPayload,
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
    const [userToDeleteAgencyRights, userToKeepAgencyRights] =
      await Promise.all([
        uow.agencyRepository.getAgenciesRightsByUserId(userToDeleteId),
        uow.agencyRepository.getAgenciesRightsByUserId(userToKeepId),
      ]);

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

    await Promise.all(
      newAgenciesRightForUser.map(async (agencyRightsForUser) =>
        updateAgencyRightsForUser(uow, userToKeepId, agencyRightsForUser),
      ),
    );

    await Promise.all(
      userToDeleteAgencyRights.map(async (agencyRightsForUser) =>
        removeAgencyRightsForUser(uow, userToDeleteId, agencyRightsForUser),
      ),
    );

    await uow.userRepository.delete(userToDeleteId);
  }
}
