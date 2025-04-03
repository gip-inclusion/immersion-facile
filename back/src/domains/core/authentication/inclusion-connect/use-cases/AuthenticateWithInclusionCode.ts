import {
  type AbsoluteUrl,
  type AuthenticateWithOAuthCodeParams,
  type AuthenticatedUserQueryParams,
  TWELVE_HOURS_IN_SECONDS,
  type User,
  type UserId,
  authenticateWithOAuthCodeSchema,
  currentJwtVersions,
  errors,
  frontRoutes,
  queryParamsAsString,
} from "shared";
import {
  type AgencyRightOfUser,
  removeAgencyRightsForUser,
  updateAgencyRightsForUser,
} from "../../../../agency/ports/AgencyRepository";
import { TransactionalUseCase } from "../../../UseCase";
import type { CreateNewEvent } from "../../../events/ports/EventBus";
import type { GenerateInclusionConnectJwt } from "../../../jwt";
import type { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";
import type { GetAccessTokenPayload, OAuthGateway } from "../port/OAuthGateway";

type ConnectedRedirectUrl = AbsoluteUrl;

export class AuthenticateWithInclusionCode extends TransactionalUseCase<
  AuthenticateWithOAuthCodeParams,
  ConnectedRedirectUrl
> {
  protected inputSchema = authenticateWithOAuthCodeSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #oAuthGateway: OAuthGateway;

  readonly #uuidGenerator: UuidGenerator;

  readonly #generateAuthenticatedUserJwt: GenerateInclusionConnectJwt;

  readonly #immersionFacileBaseUrl: AbsoluteUrl;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    oAuthGateway: OAuthGateway,
    uuidGenerator: UuidGenerator,
    generateAuthenticatedUserJwt: GenerateInclusionConnectJwt,
    immersionFacileBaseUrl: AbsoluteUrl,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#oAuthGateway = oAuthGateway;
    this.#uuidGenerator = uuidGenerator;
    this.#generateAuthenticatedUserJwt = generateAuthenticatedUserJwt;
    this.#immersionFacileBaseUrl = immersionFacileBaseUrl;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    { code, page, state }: AuthenticateWithOAuthCodeParams,
    uow: UnitOfWork,
  ): Promise<ConnectedRedirectUrl> {
    const [existingOngoingOAuth, accessToken] = await Promise.all([
      uow.ongoingOAuthRepository.findByStateAndProvider(state, "proConnect"),
      this.#oAuthGateway.getAccessToken({
        code,
        page,
      }),
    ]);

    if (!existingOngoingOAuth)
      throw errors.inclusionConnect.missingOAuth({
        state,
        identityProvider: "proConnect",
      });

    if (accessToken.payload.nonce !== existingOngoingOAuth.nonce)
      throw errors.inclusionConnect.nonceMismatch();

    const newOrUpdatedUser = await this.#makeNewOrUpdatedUser(
      uow,
      accessToken.payload,
    );

    await Promise.all([
      uow.userRepository.save(newOrUpdatedUser),
      uow.ongoingOAuthRepository.save({
        ...existingOngoingOAuth,
        userId: newOrUpdatedUser.id,
        externalId: accessToken.payload.sub,
        accessToken: accessToken.accessToken,
      }),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "UserAuthenticatedSuccessfully",
          payload: {
            userId: newOrUpdatedUser.id,
            provider: existingOngoingOAuth.provider,
            codeSafir: accessToken.payload.structure_pe ?? null,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: newOrUpdatedUser.id,
            },
          },
        }),
      ),
    ]);

    return `${this.#immersionFacileBaseUrl}/${
      frontRoutes[page]
    }?${queryParamsAsString<AuthenticatedUserQueryParams>({
      token: this.#generateAuthenticatedUserJwt(
        {
          userId: newOrUpdatedUser.id,
          version: currentJwtVersions.inclusion,
        },
        TWELVE_HOURS_IN_SECONDS,
      ),
      firstName: newOrUpdatedUser.firstName,
      lastName: newOrUpdatedUser.lastName,
      email: newOrUpdatedUser.email,
      siret: accessToken.payload.siret,
      idToken: accessToken.idToken,
    })}`;
  }

  async #makeNewOrUpdatedUser(
    uow: UnitOfWork,
    payload: GetAccessTokenPayload,
  ): Promise<User> {
    const [existingUserByExternalId, userWithSameEmail] = await Promise.all([
      uow.userRepository.findByExternalId(payload.sub),
      uow.userRepository.findByEmail(payload.email),
    ]);

    const conflictingUserFound =
      userWithSameEmail &&
      existingUserByExternalId &&
      userWithSameEmail.id !== existingUserByExternalId.id;

    if (conflictingUserFound) {
      await this.resolveConflictingUsers(
        uow,
        existingUserByExternalId.id,
        userWithSameEmail.id,
      );
    }

    return {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      externalId: payload.sub,
      id:
        existingUserByExternalId?.id ||
        userWithSameEmail?.id ||
        this.#uuidGenerator.new(),
      createdAt:
        existingUserByExternalId?.createdAt ||
        userWithSameEmail?.createdAt ||
        this.#timeGateway.now().toISOString(),
    };
  }

  private async resolveConflictingUsers(
    uow: UnitOfWork,
    userToKeepId: UserId,
    userToDeleteId: UserId,
  ): Promise<void> {
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
