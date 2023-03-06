import { Flavor } from "../typeFlavors";

export type ApiConsumerId = Flavor<string, "ApiConsumerId">;

export type ApiConsumerJwtPayload = {
  id: ApiConsumerId;
};

export type ApiConsumerName = (typeof authorisedNames)[number];

export const authorisedNames = [
  "passeEmploi",
  "unJeuneUneSolution",
  "diagoriente",
  "bimBamJob",
] as const;

export type ApiConsumer = {
  id: ApiConsumerId;
  consumer: ApiConsumerName;
  description?: string;
  isAuthorized: boolean;
  createdAt: Date;
  expirationDate: Date;
};
