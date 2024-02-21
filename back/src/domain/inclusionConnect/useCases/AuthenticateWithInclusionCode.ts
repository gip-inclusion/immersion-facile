import {
  AbsoluteUrl,
  AgencyDto,
  AuthenticateWithInclusionCodeConnectParams,
  AuthenticatedUser,
  AuthenticatedUserId,
  AuthenticatedUserQueryParams,
  InclusionConnectedUser,
  authenticateWithInclusionCodeSchema,
  currentJwtVersions,
  frontRoutes,
  queryParamsAsString,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { notifyDiscord } from "../../../utils/notifyDiscord";
import { GenerateInclusionConnectJwt } from "../../auth/jwt";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { OngoingOAuth } from "../../generic/OAuth/entities/OngoingOAuth";
import { InclusionConnectIdTokenPayload } from "../entities/InclusionConnectIdTokenPayload";
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

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    inclusionConnectGateway: InclusionConnectGateway,
    uuidGenerator: UuidGenerator,
    generateAuthenticatedUserJwt: GenerateInclusionConnectJwt,
    immersionFacileBaseUrl: AbsoluteUrl,
    inclusionConnectConfig: InclusionConnectConfig,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
    this.#inclusionConnectGateway = inclusionConnectGateway;
    this.#uuidGenerator = uuidGenerator;
    this.#generateAuthenticatedUserJwt = generateAuthenticatedUserJwt;
    this.#immersionFacileBaseUrl = immersionFacileBaseUrl;
    this.#inclusionConnectConfig = inclusionConnectConfig;
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
    throw new ForbiddenError(
      `No ongoing OAuth with provided state : ${params.state}`,
    );
  }

  async #onStructurePe(
    userId: AuthenticatedUserId,
    safirCode: string,
    uow: UnitOfWork,
  ): Promise<void> {
    const icUser = await uow.inclusionConnectedUserRepository.getById(userId);
    if (!icUser)
      throw new NotFoundError(`Inclusion Connect user '${userId}' not found.`);

    if (isIcUserAlreadyHasValidRight(icUser, safirCode)) return;

    const agency: AgencyDto | undefined =
      await uow.agencyRepository.getBySafir(safirCode);
    if (!agency) return;

    await uow.inclusionConnectedUserRepository.update({
      ...icUser,
      agencyRights: [
        ...icUser.agencyRights.filter(
          (agencyRight) => agencyRight.agency.codeSafir !== safirCode,
        ),
        { agency, role: "validator" },
      ],
    });
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
      throw new ForbiddenError("Nonce mismatch");

    const existingAuthenticatedUser =
      await uow.authenticatedUserRepository.findByExternalId(
        icIdTokenPayload.sub,
      );

    const newOrUpdatedAuthenticatedUser: AuthenticatedUser = {
      ...this.#makeAuthenticatedUser(
        this.#uuidGenerator.new(),
        icIdTokenPayload,
      ),
      ...(existingAuthenticatedUser && {
        id: existingAuthenticatedUser.id,
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
    await uow.authenticatedUserRepository.save(newOrUpdatedAuthenticatedUser);
    await uow.ongoingOAuthRepository.save(ongoingOAuth);

    if (icIdTokenPayload.structure_pe)
      await this.#onStructurePe(
        newOrUpdatedAuthenticatedUser.id,
        icIdTokenPayload.structure_pe,
        uow,
      );

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "UserAuthenticatedSuccessfully",
        payload: {
          userId: newOrUpdatedAuthenticatedUser.id,
          provider: ongoingOAuth.provider,
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

  #makeAuthenticatedUser(
    userId: string,
    jwtPayload: InclusionConnectIdTokenPayload,
  ): AuthenticatedUser {
    return {
      id: userId,
      firstName: jwtPayload.given_name,
      lastName: jwtPayload.family_name,
      email: jwtPayload.email,
      externalId: jwtPayload.sub,
    };
  }
}
const isIcUserAlreadyHasValidRight = (
  icUser: InclusionConnectedUser,
  codeSafir: string,
) =>
  icUser.agencyRights.some(
    ({ agency, role }) => agency.codeSafir === codeSafir && role !== "toReview",
  );
