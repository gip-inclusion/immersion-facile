import {
  AbsoluteUrl,
  AgencyRight,
  AuthenticateWithInclusionCodeConnectParams,
  AuthenticatedUserQueryParams,
  User,
  authenticateWithInclusionCodeSchema,
  currentJwtVersions,
  errors,
  frontRoutes,
  queryParamsAsString,
} from "shared";
import { notifyDiscord } from "../../../../../utils/notifyDiscord";
import { TransactionalUseCase } from "../../../UseCase";
import { CreateNewEvent } from "../../../events/ports/EventBus";
import { GenerateInclusionConnectJwt } from "../../../jwt";
import { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";
import { InclusionConnectIdTokenPayload } from "../entities/InclusionConnectIdTokenPayload";
import { OngoingOAuth } from "../entities/OngoingOAuth";
import { makeInclusionConnectRedirectUri } from "../entities/inclusionConnectRedirectUrl";
import { InclusionConnectGateway } from "../port/InclusionConnectGateway";
import { InclusionConnectConfig } from "./InitiateInclusionConnect";

type ConnectedRedirectUrl = AbsoluteUrl;

export class AuthenticateWithInclusionCode extends TransactionalUseCase<
  AuthenticateWithInclusionCodeConnectParams,
  ConnectedRedirectUrl
> {
  protected inputSchema = authenticateWithInclusionCodeSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #inclusionConnectGateway: InclusionConnectGateway;

  readonly #uuidGenerator: UuidGenerator;

  readonly #generateAuthenticatedUserJwt: GenerateInclusionConnectJwt;

  readonly #immersionFacileBaseUrl: AbsoluteUrl;

  readonly #inclusionConnectConfig: InclusionConnectConfig;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    inclusionConnectGateway: InclusionConnectGateway,
    uuidGenerator: UuidGenerator,
    generateAuthenticatedUserJwt: GenerateInclusionConnectJwt,
    immersionFacileBaseUrl: AbsoluteUrl,
    inclusionConnectConfig: InclusionConnectConfig,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
    this.#inclusionConnectGateway = inclusionConnectGateway;
    this.#uuidGenerator = uuidGenerator;
    this.#generateAuthenticatedUserJwt = generateAuthenticatedUserJwt;
    this.#immersionFacileBaseUrl = immersionFacileBaseUrl;
    this.#inclusionConnectConfig = inclusionConnectConfig;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    params: AuthenticateWithInclusionCodeConnectParams,
    uow: UnitOfWork,
  ): Promise<ConnectedRedirectUrl> {
    const existingOngoingOAuth = await uow.ongoingOAuthRepository.findByState(
      params.state,
      "inclusionConnect",
    );
    if (existingOngoingOAuth)
      return this.#onOngoingOAuth(params, uow, existingOngoingOAuth);
    throw errors.inclusionConnect.missingOAuth({ state: params.state });
  }

  async #onOngoingOAuth(
    params: AuthenticateWithInclusionCodeConnectParams,
    uow: UnitOfWork,
    existingOngoingOAuth: OngoingOAuth,
  ): Promise<ConnectedRedirectUrl> {
    const { accessToken, expire, icIdTokenPayload } =
      await this.#inclusionConnectGateway.getAccessToken({
        code: params.code,
        redirectUri: makeInclusionConnectRedirectUri(
          this.#inclusionConnectConfig,
          { page: params.page },
        ),
      });

    if (icIdTokenPayload.nonce !== existingOngoingOAuth.nonce)
      throw errors.inclusionConnect.nonceMismatch();

    const existingInclusionConnectedUser =
      await uow.userRepository.findByExternalId(icIdTokenPayload.sub);

    const userWithSameEmail = await uow.userRepository.findByEmail(
      icIdTokenPayload.email,
    );

    const existingUser = await this.#makeExistingUser(
      existingInclusionConnectedUser,
      userWithSameEmail,
      uow,
    );

    const newOrUpdatedAuthenticatedUser: User = {
      ...this.#makeAuthenticatedUser(
        this.#uuidGenerator.new(),
        this.#timeGateway.now(),
        icIdTokenPayload,
      ),
      ...(existingUser && {
        id: existingUser.id,
        createdAt: existingUser.createdAt,
      }),
    };

    const ongoingOAuth: OngoingOAuth = {
      ...existingOngoingOAuth,
      userId: newOrUpdatedAuthenticatedUser.id,
      externalId: icIdTokenPayload.sub,
      accessToken,
    };

    if (!newOrUpdatedAuthenticatedUser.externalId) {
      notifyDiscord(
        `Usecase AuthenticateWithInclusionCode. No ongoing_oauths found for externalId:
          ${newOrUpdatedAuthenticatedUser.id}`,
      );
    }

    await uow.userRepository.save(newOrUpdatedAuthenticatedUser);
    await uow.ongoingOAuthRepository.save(ongoingOAuth);

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "UserAuthenticatedSuccessfully",
        payload: {
          userId: newOrUpdatedAuthenticatedUser.id,
          provider: ongoingOAuth.provider,
          codeSafir: icIdTokenPayload.structure_pe ?? null,
          triggeredBy: {
            kind: "inclusion-connected",
            userId: newOrUpdatedAuthenticatedUser.id,
          },
        },
      }),
    );

    const token = this.#generateAuthenticatedUserJwt(
      {
        userId: newOrUpdatedAuthenticatedUser.id,
        version: currentJwtVersions.inclusion,
      },
      expire * 60,
    );

    return `${this.#immersionFacileBaseUrl}/${
      frontRoutes[params.page]
    }?${queryParamsAsString<AuthenticatedUserQueryParams>({
      token,
      firstName: newOrUpdatedAuthenticatedUser.firstName,
      lastName: newOrUpdatedAuthenticatedUser.lastName,
      email: newOrUpdatedAuthenticatedUser.email,
    })}`;
  }

  async #makeExistingUser(
    existingInclusionConnectedUser: User | undefined,
    userWithSameEmail: User | undefined,
    uow: UnitOfWork,
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
        conflictingUser,
        existingInclusionConnectedUser,
        uow,
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
    jwtPayload: InclusionConnectIdTokenPayload,
  ): User {
    return {
      id: userId,
      firstName: jwtPayload.given_name,
      lastName: jwtPayload.family_name,
      email: jwtPayload.email,
      externalId: jwtPayload.sub,
      createdAt: createdAt.toISOString(),
    };
  }

  async #updateUserAgencyRights(
    conflictingUser: User,
    userToKeep: User,
    uow: UnitOfWork,
  ): Promise<void> {
    const conflictingIcUser = await uow.userRepository.getById(
      conflictingUser.id,
    );
    const userToKeepIcUser = await uow.userRepository.getById(userToKeep.id);
    if (!conflictingIcUser || !userToKeepIcUser) return;

    const conflictingUserAgencyRights = conflictingIcUser.agencyRights;
    const userToKeepAgencyRights = userToKeepIcUser.agencyRights;

    await uow.userRepository.updateAgencyRights({
      agencyRights: this.#mergeAgencyRights(
        conflictingUserAgencyRights,
        userToKeepAgencyRights,
      ),
      userId: userToKeepIcUser.id,
    });
  }

  #mergeAgencyRights(
    oldAgencyRights: AgencyRight[],
    newAgencyRights: AgencyRight[],
  ): AgencyRight[] {
    return oldAgencyRights.reduce<AgencyRight[]>((acc, oldAgencyRight) => {
      const newAgencyRight = newAgencyRights.find(
        (newAgencyRight) =>
          newAgencyRight.agency.id === oldAgencyRight.agency.id,
      );
      if (newAgencyRight) {
        return [
          ...acc,
          {
            ...newAgencyRight,
            isNotifiedByEmail:
              newAgencyRight.isNotifiedByEmail ||
              oldAgencyRight.isNotifiedByEmail,
            roles: [...newAgencyRight.roles, ...oldAgencyRight.roles],
          },
        ];
      }
      return [...acc, oldAgencyRight];
    }, []);
  }
}
