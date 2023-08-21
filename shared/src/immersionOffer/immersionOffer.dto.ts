import { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";

export type ImmersionOfferInput = {
  siret: SiretDto;
  appellationCode: AppellationCode;
};
