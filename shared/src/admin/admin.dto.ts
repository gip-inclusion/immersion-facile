import { Flavor } from "../typeFlavors";

export type AdminToken = Flavor<string, "AdminToken">;

export type UserAndPassword = {
  user: string;
  password: string;
};

export type WithAuthorization = { authorization: string };
