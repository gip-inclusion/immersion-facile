import { IdentityProvider, OngoingOAuth } from "../entities/OngoingOAuth";

export interface OngoingOAuthRepository {
  save(onGoingOAuth: OngoingOAuth): Promise<void>;
  findByState(
    state: string,
    provider: IdentityProvider,
  ): Promise<OngoingOAuth | undefined>;
}
