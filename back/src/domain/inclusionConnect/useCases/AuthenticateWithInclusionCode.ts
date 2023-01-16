import { decodeJwtWithoutSignatureCheck } from "shared";
import { AuthenticateWithInclusionCodeConnectParams } from "shared";
import { authenticateWithInclusionCodeSchema } from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { GenerateAuthenticatedUserToken } from "../../auth/jwt";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import { AuthenticatedUser } from "../../generic/OAuth/entities/AuthenticatedUser";
import { OngoingOAuth } from "../../generic/OAuth/entities/OngoingOAuth";
import { InclusionConnectGateway } from "../port/InclusionConnectGateway";
import { InclusionConnectIdTokenPayload } from "../entities/InclusionConnectIdTokenPayload";

type Token = string;

export class AuthenticateWithInclusionCode extends TransactionalUseCase<
  AuthenticateWithInclusionCodeConnectParams,
  Token
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
    private inclusionConnectGateway: InclusionConnectGateway,
    private uuidGenerator: UuidGenerator,
    private generateAppToken: GenerateAuthenticatedUserToken,
  ) {
    super(uowPerformer);
  }

  inputSchema = authenticateWithInclusionCodeSchema;

  protected async _execute(
    params: AuthenticateWithInclusionCodeConnectParams,
    uow: UnitOfWork,
  ): Promise<Token> {
    const existingOngoingOAuth = await uow.ongoingOAuthRepository.findByState(
      params.state,
      "inclusionConnect",
    );
    if (existingOngoingOAuth)
      return this.onOngoingOAuth(params, uow, existingOngoingOAuth);
    throw new ForbiddenError(
      `No ongoing OAuth with provided state : ${params.state}`,
    );
  }

  private async onOngoingOAuth(
    params: AuthenticateWithInclusionCodeConnectParams,
    uow: UnitOfWork,
    existingOngoingOAuth: OngoingOAuth,
  ) {
    const response = await this.inclusionConnectGateway.getAccessToken(
      params.code,
    );
    const jwtPayload =
      decodeJwtWithoutSignatureCheck<InclusionConnectIdTokenPayload>(
        response.id_token,
      );

    if (jwtPayload.nonce !== existingOngoingOAuth.nonce)
      throw new ForbiddenError("Nonce mismatch");

    const existingAuthenticatedUser =
      await uow.authenticatedUserRepository.findByEmail(jwtPayload.email);

    const newOrUpdatedAuthenticatedUser: AuthenticatedUser = {
      ...existingAuthenticatedUser,
      ...this.makeAuthenticatedUser(this.uuidGenerator.new(), jwtPayload),
      ...(existingAuthenticatedUser && {
        email: existingAuthenticatedUser.email,
        id: existingAuthenticatedUser.id,
      }),
    };

    const ongoingOAuth: OngoingOAuth = {
      ...existingOngoingOAuth,
      userId: newOrUpdatedAuthenticatedUser.id,
      externalId: jwtPayload.sub,
      accessToken: response.access_token,
    };

    await Promise.all([
      uow.ongoingOAuthRepository.save(ongoingOAuth),
      uow.authenticatedUserRepository.save(newOrUpdatedAuthenticatedUser),
      uow.outboxRepository.save(
        this.createNewEvent({
          topic: "UserAuthenticatedSuccessfully",
          payload: {
            userId: newOrUpdatedAuthenticatedUser.id,
            provider: ongoingOAuth.provider,
          },
        }),
      ),
    ]);

    return this.generateAppToken(
      { userId: newOrUpdatedAuthenticatedUser.id },
      response.expires_in * 60,
    );
  }

  private makeAuthenticatedUser(
    userId: string,
    jwtPayload: InclusionConnectIdTokenPayload,
  ): AuthenticatedUser {
    return {
      id: userId,
      email: jwtPayload.email,
      firstName: jwtPayload.given_name,
      lastName: jwtPayload.family_name,
    };
  }
}
