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
import {
  InclusionConnectGateway,
  InclusionConnectIdTokenPayload,
} from "../port/InclusionConnectGateway";

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
    if (!existingOngoingOAuth)
      throw new ForbiddenError(
        `No ongoing OAuth with provided state : ${params.state}`,
      );

    const response = await this.inclusionConnectGateway.getAccessToken(
      params.code,
    );
    const jwtPayload =
      decodeJwtWithoutSignatureCheck<InclusionConnectIdTokenPayload>(
        response.id_token,
      );

    const existingUser = await uow.authenticatedUserRepository.findByEmail(
      jwtPayload.email,
    );

    const userId = this.uuidGenerator.new();

    const authenticatedUser: AuthenticatedUser = existingUser ?? {
      id: userId,
      email: jwtPayload.email,
      firstName: jwtPayload.given_name,
      lastName: jwtPayload.family_name,
    };

    const ongoingOAuth: OngoingOAuth = {
      ...existingOngoingOAuth,
      userId,
      externalId: jwtPayload.sub,
      accessToken: response.access_token,
    };

    const userAuthenticatedEvent = this.createNewEvent({
      topic: "UserAuthenticatedSuccessfully",
      payload: {
        userId: authenticatedUser.id,
        provider: ongoingOAuth.provider,
      },
    });

    await Promise.all([
      uow.ongoingOAuthRepository.save(ongoingOAuth),
      uow.authenticatedUserRepository.save(authenticatedUser),
      uow.outboxRepository.save(userAuthenticatedEvent),
    ]);

    return this.generateAppToken({ userId });
  }
}
