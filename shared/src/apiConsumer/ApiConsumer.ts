import { Email } from "../email/email.dto";
import { Flavor } from "../typeFlavors";

export type ApiConsumerId = Flavor<string, "ApiConsumerId">;

export type ApiConsumerJwtPayload = {
  id: ApiConsumerId;
};

export type ApiConsumerName = Flavor<string, "ApiConsumerName">;

export type ApiConsumer = {
  id: ApiConsumerId;
  consumer: ApiConsumerName;
  contact: ApiConsumerContact;
  description?: string;
  isAuthorized: boolean;
  createdAt: Date;
  expirationDate: Date;
};

export type ApiConsumerContact = {
  lastName: string;
  firstName: string;
  job: string;
  phone: string;
  emails: Email[];
};
