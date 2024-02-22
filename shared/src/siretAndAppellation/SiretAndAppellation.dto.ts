import { LocationId } from "../address/address.dto";
import { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";

export type SiretAndAppellationDto = {
  appellationCode: AppellationCode;
  siret: SiretDto;
};

export type SearchResultQuery = SiretAndAppellationDto & {
  locationId: LocationId;
};
