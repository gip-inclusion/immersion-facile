import { AppellationCode, RomeCode } from "../../../shared/rome";
import { AppellationDto } from "../../../shared/romeAndAppellationDtos/romeAndAppellation.dto";

export type RomeMetier = {
  codeMetier: RomeCode;
  libelle: string;
};

export interface RomeRepository {
  appellationToCodeMetier(
    romeCodeAppellation: AppellationCode,
  ): Promise<RomeCode | undefined>;
  searchMetier: (query: string) => Promise<RomeMetier[]>;
  searchAppellation: (query: string) => Promise<AppellationDto[]>;
}
