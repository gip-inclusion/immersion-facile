import { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";

export type SiretAndAppellationDto = {
  appellationCode: AppellationCode;
  siret: string;
};
