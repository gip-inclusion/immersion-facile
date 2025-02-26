import type { RomeCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";

export type SiretAndRomeDto = {
  rome: RomeCode;
  siret: SiretDto;
};
