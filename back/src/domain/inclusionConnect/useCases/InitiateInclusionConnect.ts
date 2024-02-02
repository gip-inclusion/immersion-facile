import {
  AbsoluteUrl,
  WithSourcePage,
  queryParamsAsString,
  withSourcePageSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { makeInclusionConnectRedirectUri } from "../entities/inclusionConnectRedirectUrl";

type InclusionConnectUrlParams = {
  response_type: "code";
  client_id: string;
  redirect_uri: AbsoluteUrl;
  scope: string;
  state: string;
  nonce: string;
  login_hint?: string;
};

export type InclusionConnectConfig = {
  clientId: string;
  clientSecret: string;
  immersionRedirectUri: AbsoluteUrl;
  inclusionConnectBaseUri: AbsoluteUrl;
  scope: string;
};

export class InitiateInclusionConnect extends TransactionalUseCase<
  WithSourcePage,
  AbsoluteUrl
> {
  protected inputSchema = withSourcePageSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private uuidGenerator: UuidGenerator,
    private inclusionConnectConfig: InclusionConnectConfig,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    params: WithSourcePage,
    uow: UnitOfWork,
  ): Promise<AbsoluteUrl> {
    const nonce = this.uuidGenerator.new();
    const state = this.uuidGenerator.new();

    await uow.ongoingOAuthRepository.save({
      nonce,
      state,
      provider: "inclusionConnect",
    });

    // the following is made in order to support both the old and the new InclusionConnect urls:
    // Base Url was : https://connect.inclusion.beta.gouv.fr/realms/inclusion-connect/protocol/openid-connect
    // OLD : "https://connect.inclusion.beta.gouv.fr/realms/inclusion-connect/protocol/openid-connect/auth"

    // Base Url will be : https://connect.inclusion.beta.gouv.fr/auth
    // NEW : "https://connect.inclusion.beta.gouv.fr/auth/authorize"
    // or : "https://recette.connect.inclusion.beta.gouv.fr/auth/authorize"

    const authorizeInPath =
      this.inclusionConnectConfig.inclusionConnectBaseUri.includes(
        "connect.inclusion.beta.gouv.fr/auth",
      )
        ? "authorize"
        : "auth";

    return `${
      this.inclusionConnectConfig.inclusionConnectBaseUri
    }/${authorizeInPath}?${queryParamsAsString<InclusionConnectUrlParams>({
      client_id: this.inclusionConnectConfig.clientId,
      nonce,
      redirect_uri: makeInclusionConnectRedirectUri(
        this.inclusionConnectConfig,
        params,
      ),
      response_type: "code",
      scope: this.inclusionConnectConfig.scope,
      state,
    })}`;
  }
}
