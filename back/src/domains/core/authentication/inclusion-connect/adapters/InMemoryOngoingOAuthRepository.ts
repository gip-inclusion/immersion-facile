import { type OAuthState, type UserId, replaceArrayElement } from "shared";
import type { OngoingOAuth } from "../entities/OngoingOAuth";
import type { OngoingOAuthRepository } from "../port/OngoingOAuthRepositiory";

export class InMemoryOngoingOAuthRepository implements OngoingOAuthRepository {
  // for test purpose
  #ongoingOAuths: OngoingOAuth[] = [];

  public async findByState(state: OAuthState) {
    return this.ongoingOAuths.find(
      (ongoingOAuth) => ongoingOAuth.state === state,
    );
  }

  public async findByUserId(userId: UserId): Promise<OngoingOAuth | undefined> {
    return this.ongoingOAuths.find(
      (ongoingOAuth) => ongoingOAuth.userId === userId,
    );
  }

  public async save(newOngoingOAuth: OngoingOAuth): Promise<void> {
    const existingOngoingOAuth = await this.findByState(newOngoingOAuth.state);

    if (!existingOngoingOAuth) {
      this.#ongoingOAuths = [...this.#ongoingOAuths, newOngoingOAuth];
      return;
    }

    this.#ongoingOAuths = replaceArrayElement(
      this.#ongoingOAuths,
      this.#ongoingOAuths.findIndex(
        ({ state }) => state === existingOngoingOAuth.state,
      ),
      newOngoingOAuth,
    );
  }

  // for test purpose
  public get ongoingOAuths(): OngoingOAuth[] {
    return this.#ongoingOAuths;
  }

  public set ongoingOAuths(ongoingOAuths: OngoingOAuth[]) {
    this.#ongoingOAuths = ongoingOAuths.map(({ ...params }) => ({ ...params }));
  }
}
