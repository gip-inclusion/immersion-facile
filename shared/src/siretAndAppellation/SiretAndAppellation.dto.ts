import { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";

export type SiretAndAppellationDto = {
  appellationCode: AppellationCode;
  siret: SiretDto;
};
