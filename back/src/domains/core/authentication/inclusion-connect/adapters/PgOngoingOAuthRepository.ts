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
  email: string | null;
  used_at: Date | null;
};

export class PgOngoingOAuthRepository implements OngoingOAuthRepository {
  constructor(private transaction: KyselyDb) {}

  public async findByState(
    state: OAuthState,
  ): Promise<OngoingOAuth | undefined> {
    const pgOngoingOAuth: PersistenceOngoingOAuth | undefined =
      await this.transaction
        .selectFrom("users_ongoing_oauths")
        .selectAll()
        .where("state", "=", state)
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
    const { provider, nonce, state, userId, usedAt } = ongoingOAuth;
    if (await this.findByState(state)) {
      await this.transaction
        .updateTable("users_ongoing_oauths")
        .set({
          nonce,
          user_id: userId,
          provider,
          used_at: usedAt,
          ...(ongoingOAuth.provider === "proConnect"
            ? {
                external_id: ongoingOAuth.externalId,
                access_token: ongoingOAuth.accessToken,
              }
            : {}),
          ...(ongoingOAuth.provider === "email"
            ? { email: ongoingOAuth.email }
            : {}),
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
          ...(ongoingOAuth.provider === "proConnect"
            ? {
                external_id: ongoingOAuth.externalId,
                access_token: ongoingOAuth.accessToken,
              }
            : {}),
          ...(ongoingOAuth.provider === "email"
            ? { email: ongoingOAuth.email }
            : {}),
          used_at: usedAt,
        })
        .execute();
    }
  }

  #toOngoingOAuth(raw?: PersistenceOngoingOAuth): OngoingOAuth | undefined {
    if (!raw) return;
    const provider = raw.provider as IdentityProvider;
    const usedAt = raw.used_at;

    if (provider === "proConnect")
      return {
        state: raw.state,
        nonce: raw.nonce,
        userId: optional(raw.user_id),
        provider,
        accessToken: optional(raw.access_token),
        externalId: optional(raw.external_id),
        usedAt,
      };

    if (!raw.email)
      throw new Error(`Unsupported, raw.email was : ${raw?.email}`);

    return {
      state: raw.state,
      nonce: raw.nonce,
      userId: optional(raw.user_id),
      provider,
      email: raw.email,
      usedAt,
    };
  }
}
