import { AuthenticatedUser } from "shared";
import { OngoingOAuth } from "../entities/OngoingOAuth";

export type OngoingOAuthQueries = {
  save(
    ongoingOAuth: OngoingOAuth,
    authenticatedUser: AuthenticatedUser,
  ): Promise<void>;
};
