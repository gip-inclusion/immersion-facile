import { PoolClient } from "pg";
import {
  IdentityProvider,
  OngoingOAuth,
} from "../../../domain/generic/OAuth/entities/OngoingOAuth";
import { OngoingOAuthRepository } from "../../../domain/generic/OAuth/ports/OngoingOAuthRepositiory";
import { optional } from "./pgUtils";

type PersistenceOngoingOAuth = {
  provider: string;
  state: string;
  nonce: string;
  user_id?: string;
  external_id?: string;
  access_token?: string;
  createAt: string;
  updateAt: string;
};

export class PgOngoingOAuthRepository implements OngoingOAuthRepository {
  constructor(private client: PoolClient) {}

  async findByState(
    state: string,
    provider: "inclusionConnect",
  ): Promise<OngoingOAuth | undefined> {
    const response = await this.client.query(
      `
        SELECT * FROM ongoing_oauths WHERE state=$1 AND provider = $2
        `,
      [state, provider],
    );
    return this.toOngoingOAuth(response.rows[0]);
  }

  public async save(ongoingOAuth: OngoingOAuth): Promise<void> {
    const { state, nonce, provider, userId, externalId, accessToken } =
      ongoingOAuth;
    if (await this.findByState(state, provider)) {
      await this.client.query(
        `
        UPDATE ongoing_oauths
        SET state=$1, nonce=$2, provider=$3, user_id=$4, external_id=$5, access_token=$6, updated_at=now() 
        WHERE state=$1 
      `,
        [state, nonce, provider, userId, externalId, accessToken],
      );
    } else {
      await this.client.query(
        `
      INSERT INTO ongoing_oauths(state, nonce, provider, user_id, external_id, access_token) VALUES ($1, $2, $3, $4, $5, $6 )
      `,
        [state, nonce, provider, userId, externalId, accessToken],
      );
    }
  }

  private toOngoingOAuth(
    raw?: PersistenceOngoingOAuth,
  ): OngoingOAuth | undefined {
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
