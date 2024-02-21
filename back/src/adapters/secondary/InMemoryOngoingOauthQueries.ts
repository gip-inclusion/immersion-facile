import { AuthenticatedUser } from "shared";
import { OngoingOAuth } from "../../domain/generic/OAuth/entities/OngoingOAuth";
import { OngoingOAuthQueries } from "../../domain/generic/OAuth/ports/OngoingOAuthQueries";
import { InMemoryAuthenticatedUserRepository } from "./InMemoryAuthenticatedUserRepository";
import { InMemoryOngoingOAuthRepository } from "./InMemoryOngoingOAuthRepository";

export class InMemoryOngoingOauthQueries implements OngoingOAuthQueries {
  constructor(
    private readonly authenticatedUserRepository: InMemoryAuthenticatedUserRepository,
    private readonly ongoingOAuthRepository: InMemoryOngoingOAuthRepository,
  ) {}

  public async save(
    ongoingOAuth: OngoingOAuth,
    authenticatedUser: AuthenticatedUser,
  ): Promise<void> {
    await this.ongoingOAuthRepository.save(ongoingOAuth);
    await this.authenticatedUserRepository.save(authenticatedUser);
  }
}
