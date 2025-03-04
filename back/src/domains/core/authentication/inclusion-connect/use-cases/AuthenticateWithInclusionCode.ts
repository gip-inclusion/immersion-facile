import {
  AbsoluteUrl,
  AuthenticateWithOAuthCodeParams,
  AuthenticatedUserQueryParams,
  OAuthCode,
  User,
  WithSourcePage,
  authenticateWithOAuthCodeSchema,
  currentJwtVersions,
  errors,
  frontRoutes,
  queryParamsAsString,
} from "shared";
import { notifyTeam } from "../../../../../utils/notifyTeam";
import {
  AgencyRightOfUser,
  removeAgencyRightsForUser,
  updateAgencyRightsForUser,
} from "../../../../agency/ports/AgencyRepository";
import { TransactionalUseCase } from "../../../UseCase";
import { CreateNewEvent } from "../../../events/ports/EventBus";
import { GenerateInclusionConnectJwt } from "../../../jwt";
import { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";
import { OngoingOAuth } from "../entities/OngoingOAuth";
import { GetAccessTokenPayload, OAuthGateway } from "../port/OAuthGateway";

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
    const existingOngoingOAuth =
      await uow.ongoingOAuthRepository.findByStateAndProvider(
        state,
        "proConnect",
      );
    if (existingOngoingOAuth)
      return this.#onOngoingOAuth(uow, { code, page }, existingOngoingOAuth);
    throw errors.inclusionConnect.missingOAuth({
      state,
      identityProvider: "proConnect",
    });
  }

  async #onOngoingOAuth(
    uow: UnitOfWork,
    { code, page }: WithSourcePage & { code: OAuthCode },
    existingOngoingOAuth: OngoingOAuth,
  ): Promise<ConnectedRedirectUrl> {
    const { accessToken, payload, idToken } =
      await this.#oAuthGateway.getAccessToken({
        code,
        page,
      });

    if (payload.nonce !== existingOngoingOAuth.nonce)
      throw errors.inclusionConnect.nonceMismatch();

    const existingInclusionConnectedUser =
      await uow.userRepository.findByExternalId(payload.sub);

    const userWithSameEmail = await uow.userRepository.findByEmail(
      payload.email,
    );

    const existingUser = await this.#makeExistingUser(
      uow,
      existingInclusionConnectedUser,
      userWithSameEmail,
    );

    const authenticatedUser = this.#makeAuthenticatedUser(
      this.#uuidGenerator.new(),
      this.#timeGateway.now(),
      payload,
    );

    const newOrUpdatedAuthenticatedUser: User = {
      ...authenticatedUser,
      ...(existingUser && {
        id: existingUser.id,
        createdAt: existingUser.createdAt,
      }),
    };

    const ongoingOAuth: OngoingOAuth = {
      ...existingOngoingOAuth,
      userId: newOrUpdatedAuthenticatedUser.id,
      externalId: payload.sub,
      accessToken,
    };

    if (!newOrUpdatedAuthenticatedUser.externalId) {
      notifyTeam({
        rawContent: `Usecase AuthenticateWithInclusionCode. No ongoing_oauths found for externalId:
          ${newOrUpdatedAuthenticatedUser.id}`,
        isError: true,
      });
    }

    await uow.userRepository.save(newOrUpdatedAuthenticatedUser);
    await uow.ongoingOAuthRepository.save(ongoingOAuth);

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "UserAuthenticatedSuccessfully",
        payload: {
          userId: newOrUpdatedAuthenticatedUser.id,
          provider: ongoingOAuth.provider,
          codeSafir: payload.structure_pe ?? null,
          triggeredBy: {
            kind: "inclusion-connected",
            userId: newOrUpdatedAuthenticatedUser.id,
          },
        },
      }),
    );

    const twelveHoursInSeconds = 12 * 60 * 60;

    const token = this.#generateAuthenticatedUserJwt(
      {
        userId: newOrUpdatedAuthenticatedUser.id,
        version: currentJwtVersions.inclusion,
      },
      twelveHoursInSeconds,
    );

    return `${this.#immersionFacileBaseUrl}/${
      frontRoutes[page]
    }?${queryParamsAsString<AuthenticatedUserQueryParams>({
      token,
      firstName: newOrUpdatedAuthenticatedUser.firstName,
      lastName: newOrUpdatedAuthenticatedUser.lastName,
      email: newOrUpdatedAuthenticatedUser.email,
      siret: payload.siret,
      idToken,
    })}`;
  }

  async #makeExistingUser(
    uow: UnitOfWork,
    existingInclusionConnectedUser: User | undefined,
    userWithSameEmail: User | undefined,
  ): Promise<User | undefined> {
    const existingUser = existingInclusionConnectedUser ?? userWithSameEmail;
    if (!existingUser) return undefined;
    const conflictingUserFound =
      userWithSameEmail &&
      existingInclusionConnectedUser &&
      userWithSameEmail.id !== existingInclusionConnectedUser.id;
    if (conflictingUserFound) {
      const conflictingUser = userWithSameEmail;
      await this.#updateUserAgencyRights(
        uow,
        conflictingUser,
        existingInclusionConnectedUser,
      );
      await uow.userRepository.delete(conflictingUser.id);
      const user: User = {
        createdAt: existingInclusionConnectedUser.createdAt,
        externalId: existingInclusionConnectedUser.externalId,
        id: existingInclusionConnectedUser.id,
        email: conflictingUser.email,
        firstName: conflictingUser.firstName,
        lastName: conflictingUser.lastName,
      };
      return user;
    }
    return existingUser;
  }

  #makeAuthenticatedUser(
    userId: string,
    createdAt: Date,
    jwtPayload: GetAccessTokenPayload,
  ): User {
    return {
      id: userId,
      firstName: jwtPayload.firstName,
      lastName: jwtPayload.lastName,
      email: jwtPayload.email,
      externalId: jwtPayload.sub,
      createdAt: createdAt.toISOString(),
    };
  }

  async #updateUserAgencyRights(
    uow: UnitOfWork,
    conflictingUser: User,
    userToKeep: User,
  ): Promise<void> {
    const conflictingIcUser = await uow.userRepository.getById(
      conflictingUser.id,
    );
    const userToKeepIcUser = await uow.userRepository.getById(userToKeep.id);
    if (!conflictingIcUser || !userToKeepIcUser) return;

    const conflictingUserAgencyRights =
      await uow.agencyRepository.getAgenciesRightsByUserId(
        conflictingIcUser.id,
      );
    const userToKeepAgencyRights =
      await uow.agencyRepository.getAgenciesRightsByUserId(userToKeepIcUser.id);

    const newAgenciesRightForUser = this.#mergeAgencyRights(
      conflictingUserAgencyRights,
      userToKeepAgencyRights,
    );

    await Promise.all(
      newAgenciesRightForUser.map(async (agencyRightsForUser) =>
        updateAgencyRightsForUser(
          uow,
          userToKeepIcUser.id,
          agencyRightsForUser,
        ),
      ),
    );
    await Promise.all(
      conflictingUserAgencyRights.map(async (agencyRightsForUser) =>
        removeAgencyRightsForUser(
          uow,
          conflictingIcUser.id,
          agencyRightsForUser,
        ),
      ),
    );
  }

  #mergeAgencyRights(
    oldAgencyRights: AgencyRightOfUser[],
    newAgencyRights: AgencyRightOfUser[],
  ): AgencyRightOfUser[] {
    return oldAgencyRights.reduce<AgencyRightOfUser[]>(
      (acc, oldAgencyRight) => {
        const newAgencyRight = newAgencyRights.find(
          (newAgencyRight) =>
            newAgencyRight.agencyId === oldAgencyRight.agencyId,
        );
        return [
          ...acc,
          newAgencyRight
            ? {
                ...newAgencyRight,
                isNotifiedByEmail:
                  newAgencyRight.isNotifiedByEmail ||
                  oldAgencyRight.isNotifiedByEmail,
                roles: [...newAgencyRight.roles, ...oldAgencyRight.roles],
              }
            : oldAgencyRight,
        ];
      },
      [],
    );
  }
}
