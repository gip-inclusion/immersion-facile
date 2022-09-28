import { AppellationCode, RomeCode } from "shared";
import { AppellationDto, RomeDto } from "shared";

export interface RomeRepository {
  appellationToCodeMetier(
    romeCodeAppellation: AppellationCode,
  ): Promise<RomeCode | undefined>;
  searchRome: (query: string) => Promise<RomeDto[]>;
  searchAppellation: (query: string) => Promise<AppellationDto[]>;
}
