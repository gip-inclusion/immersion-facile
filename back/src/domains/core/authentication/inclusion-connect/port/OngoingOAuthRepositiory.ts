import { InclusionConnectState } from "shared";
import { IdentityProvider, OngoingOAuth } from "../entities/OngoingOAuth";

export interface OngoingOAuthRepository {
  save(onGoingOAuth: OngoingOAuth): Promise<void>;
  findByState(
    state: InclusionConnectState,
    provider: IdentityProvider,
  ): Promise<OngoingOAuth | undefined>;
}
