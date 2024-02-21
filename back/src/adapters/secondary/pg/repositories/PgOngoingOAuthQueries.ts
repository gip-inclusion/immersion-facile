import { AuthenticatedUser } from "shared";
import { OngoingOAuth } from "../../../../domain/generic/OAuth/entities/OngoingOAuth";
import { OngoingOAuthQueries } from "../../../../domain/generic/OAuth/ports/OngoingOAuthQueries";
import { KyselyDb } from "../kysely/kyselyUtils";
import { PgAuthenticatedUserRepository } from "./PgAuthenticatedUserRepository";
import { PgOngoingOAuthRepository } from "./PgOngoingOAuthRepository";

export class PgOngoingOAuthQueries implements OngoingOAuthQueries {
  constructor(
    private transaction: KyselyDb,
    private ongoingOAuthRepository: PgOngoingOAuthRepository,
    private authenticatedUserRepository: PgAuthenticatedUserRepository,
  ) {}

  public async save(
    ongoingOAuth: OngoingOAuth,
    authenticatedUser: AuthenticatedUser,
  ) {
    await this.authenticatedUserRepository.save(authenticatedUser);
    await this.ongoingOAuthRepository.save(ongoingOAuth);
  }
}
