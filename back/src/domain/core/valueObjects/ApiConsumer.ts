import { Flavor } from "shared/src/typeFlavors";

export type ApiConsumerId = Flavor<string, "ApiConsumerId">;

export type WithApiConsumerId = {
  id: ApiConsumerId;
};

export type ApiConsumerName =
  | "passeEmploi"
  | "unJeuneUneSolution"
  | "diagoriente"
  | "testConsumer";

export type ApiConsumer = {
  id: ApiConsumerId;
  consumer: ApiConsumerName;
  description?: string;
  isAuthorized: boolean;
  createdAt: Date;
  expirationDate: Date;
};
