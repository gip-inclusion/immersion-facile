import { Flavor } from "shared";

type AuthenticatedUserId = Flavor<string, "AuthenticatedUserId">;

export type AuthenticatedUser = {
  id: AuthenticatedUserId;
  email: string;
  firstName: string;
  lastName: string;
};
