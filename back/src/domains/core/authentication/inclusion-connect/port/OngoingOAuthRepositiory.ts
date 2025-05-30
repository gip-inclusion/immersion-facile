import type { OAuthState } from "shared";
import type { OngoingOAuth } from "../entities/OngoingOAuth";

export interface OngoingOAuthRepository {
  save(onGoingOAuth: OngoingOAuth): Promise<void>;
  findByState(state: OAuthState): Promise<OngoingOAuth | undefined>;
  findByUserId(userId: string): Promise<OngoingOAuth | undefined>;
}
