import { AbsoluteUrl, queryParamsAsString } from "shared";
import { z } from "zod";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";

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
  void,
  AbsoluteUrl
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private uuidGenerator: UuidGenerator,
    private inclusionConnectConfig: InclusionConnectConfig,
  ) {
    super(uowPerformer);
  }

  protected inputSchema = z.void();

  protected async _execute(_: void, uow: UnitOfWork): Promise<AbsoluteUrl> {
    const nonce = this.uuidGenerator.new();
    const state = this.uuidGenerator.new();

    await uow.ongoingOAuthRepository.save({
      nonce,
      state,
      provider: "inclusionConnect",
    });

    return `${
      this.inclusionConnectConfig.inclusionConnectBaseUri
    }/auth?${queryParamsAsString<InclusionConnectUrlParams>({
      client_id: this.inclusionConnectConfig.clientId,
      nonce,
      redirect_uri: this.inclusionConnectConfig.immersionRedirectUri,
      response_type: "code",
      scope: this.inclusionConnectConfig.scope,
      state,
    })}`;
  }
}
