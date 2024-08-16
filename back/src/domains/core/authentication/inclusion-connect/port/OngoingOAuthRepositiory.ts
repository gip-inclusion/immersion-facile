import { IdentityProvider, OAuthState } from "shared";
import { OngoingOAuth } from "../entities/OngoingOAuth";

export interface OngoingOAuthRepository {
  save(onGoingOAuth: OngoingOAuth): Promise<void>;
  findByStateAndProvider(
    state: OAuthState,
    provider: IdentityProvider,
  ): Promise<OngoingOAuth | undefined>;
}
