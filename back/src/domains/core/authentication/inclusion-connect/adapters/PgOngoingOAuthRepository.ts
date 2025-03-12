import { sql } from "kysely";
import type { IdentityProvider, OAuthState } from "shared";
import type { KyselyDb } from "../../../../../config/pg/kysely/kyselyUtils";
import { optional } from "../../../../../config/pg/pgUtils";
import type { OngoingOAuth } from "../entities/OngoingOAuth";
import type { OngoingOAuthRepository } from "../port/OngoingOAuthRepositiory";

type PersistenceOngoingOAuth = {
  provider: string;
  state: string;
  nonce: string;
  user_id: string | null;
  external_id: string | null;
  access_token: string | null;
};

export class PgOngoingOAuthRepository implements OngoingOAuthRepository {
  constructor(private transaction: KyselyDb) {}

  public async findByStateAndProvider(
    state: OAuthState,
    provider: IdentityProvider,
  ): Promise<OngoingOAuth | undefined> {
    const pgOngoingOAuth: PersistenceOngoingOAuth | undefined =
      await this.transaction
        .selectFrom("users_ongoing_oauths")
        .selectAll()
        .where("state", "=", state)
        .where("provider", "=", provider)
        .executeTakeFirst();

    return this.#toOngoingOAuth(pgOngoingOAuth);
  }

  public async findByUserId(userId: string): Promise<OngoingOAuth | undefined> {
    const pgOngoingOAuth: PersistenceOngoingOAuth | undefined =
      await this.transaction
        .selectFrom("users_ongoing_oauths")
        .selectAll()
        .where("user_id", "=", userId)
        .orderBy("updated_at", "desc")
        .executeTakeFirst();

    return this.#toOngoingOAuth(pgOngoingOAuth);
  }

  public async save(ongoingOAuth: OngoingOAuth): Promise<void> {
    const { state, nonce, provider, userId, externalId, accessToken } =
      ongoingOAuth;
    if (await this.findByStateAndProvider(state, provider)) {
      await this.transaction
        .updateTable("users_ongoing_oauths")
        .set({
          state,
          nonce,
          provider,
          user_id: userId,
          external_id: externalId,
          access_token: accessToken,
          updated_at: sql`now()`,
        })
        .where("state", "=", state)
        .execute();
    } else {
      await this.transaction
        .insertInto("users_ongoing_oauths")
        .values({
          state,
          nonce,
          provider,
          user_id: userId,
          external_id: externalId,
          access_token: accessToken,
        })
        .execute();
    }
  }

  #toOngoingOAuth(raw?: PersistenceOngoingOAuth): OngoingOAuth | undefined {
    if (!raw) return;
    return {
      state: raw.state,
      nonce: raw.nonce,
      provider: raw.provider as IdentityProvider,
      userId: optional(raw.user_id),
      accessToken: optional(raw.access_token),
      externalId: optional(raw.external_id),
    };
  }
}
