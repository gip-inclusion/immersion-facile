import { Flavor } from "../typeFlavors";

export type BackOfficeJwt = Flavor<string, "BackOfficeJwt">;

export type UserAndPassword = {
  user: string;
  password: string;
};

export type WithAuthorization = { authorization: string };
