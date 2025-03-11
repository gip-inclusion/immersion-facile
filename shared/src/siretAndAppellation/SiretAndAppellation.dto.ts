import type { LocationId } from "../address/address.dto";
import type { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";

export type SiretAndAppellationDto = {
  appellationCode: AppellationCode;
  siret: SiretDto;
};

export type SearchResultQuery = SiretAndAppellationDto & {
  locationId: LocationId;
};
