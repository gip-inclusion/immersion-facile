import type { IdentityProvider, OAuthState } from "shared";
import type { OngoingOAuth } from "../entities/OngoingOAuth";

export interface OngoingOAuthRepository {
  save(onGoingOAuth: OngoingOAuth): Promise<void>;
  findByStateAndProvider(
    state: OAuthState,
    provider: IdentityProvider,
  ): Promise<OngoingOAuth | undefined>;
  findByUserId(userId: string): Promise<OngoingOAuth | undefined>;
}
