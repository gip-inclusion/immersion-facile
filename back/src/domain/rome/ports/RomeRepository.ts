import { AppellationCode, AppellationDto, RomeCode, RomeDto } from "shared";

export interface RomeRepository {
  appellationToCodeMetier(
    romeCodeAppellation: AppellationCode,
  ): Promise<RomeCode | undefined>;
  searchRome: (query: string) => Promise<RomeDto[]>;
  searchAppellation: (query: string) => Promise<AppellationDto[]>;
  getFullAppellationsFromCodes: (
    codes: AppellationCode[],
  ) => Promise<AppellationDto[]>;
}
