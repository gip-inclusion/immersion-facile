import { SiretDto } from "shared";

export type EstablishmentGroupEntity = {
  slug: string;
  name: string;
  sirets: SiretDto[];
};
