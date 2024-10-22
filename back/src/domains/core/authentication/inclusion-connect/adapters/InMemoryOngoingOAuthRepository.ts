import { IdentityProvider, OAuthState, UserId } from "shared";
import { OngoingOAuth } from "../entities/OngoingOAuth";
import { OngoingOAuthRepository } from "../port/OngoingOAuthRepositiory";

export class InMemoryOngoingOAuthRepository implements OngoingOAuthRepository {
  // for test purpose
  public ongoingOAuths: OngoingOAuth[] = [];

  public async findByStateAndProvider(
    state: OAuthState,
    provider: IdentityProvider,
  ) {
    return this.ongoingOAuths.find(
      (ongoingOAuth) =>
        ongoingOAuth.state === state && ongoingOAuth.provider === provider,
    );
  }

  public async findByUserId(userId: UserId): Promise<OngoingOAuth | undefined> {
    return this.ongoingOAuths.find(
      (ongoingOAuth) => ongoingOAuth.userId === userId,
    );
  }

  public async save(newOngoingOAuth: OngoingOAuth): Promise<void> {
    const existingOngoingOAuth = await this.findByStateAndProvider(
      newOngoingOAuth.state,
      newOngoingOAuth.provider,
    );

    if (!existingOngoingOAuth) {
      this.ongoingOAuths.push(newOngoingOAuth);
      return;
    }

    Object.assign(existingOngoingOAuth, newOngoingOAuth);
  }
}
