import { AuthenticatedUser } from "../AuthenticatedUser";

export type AuthenticateWithInclusionCodeConnectParams = {
  code: string;
  state: string;
};

export type AuthenticatedUserQueryParams = { token: string } & Pick<
  AuthenticatedUser,
  "email" | "firstName" | "lastName"
>;
