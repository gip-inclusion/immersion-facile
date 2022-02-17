import {
  ContactMethod,
  ImmersionContactInEstablishmentId,
} from "../../../shared/FormEstablishmentDto";

export type ContactEntityV2 = {
  id: ImmersionContactInEstablishmentId;
  lastName: string;
  firstName: string;
  email: string;
  job: string;
  phone: string;
  contactMethod: ContactMethod;
};
