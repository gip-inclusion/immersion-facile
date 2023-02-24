import { Flavor } from "./typeFlavors";

export type AuthenticatedUserId = Flavor<string, "AuthenticatedUserId">;

export type AuthenticatedUser = {
  id: AuthenticatedUserId;
  email: string;
  firstName: string;
  lastName: string;
};
