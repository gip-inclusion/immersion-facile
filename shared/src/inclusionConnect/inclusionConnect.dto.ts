import { AuthenticatedUser } from "../inclusionConnectedUser/inclusionConnectedUser.dto";

export type AuthenticateWithInclusionCodeConnectParams = {
  code: string;
  state: string;
};

export type AuthenticatedUserQueryParams = { token: string } & Pick<
  AuthenticatedUser,
  "email" | "firstName" | "lastName"
>;
