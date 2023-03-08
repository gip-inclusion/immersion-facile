import {
  EstablishmentGroupName,
  EstablishmentGroupSlug,
  SiretDto,
} from "shared";

export type EstablishmentGroupEntity = {
  slug: EstablishmentGroupSlug;
  name: EstablishmentGroupName;
  sirets: SiretDto[];
};
