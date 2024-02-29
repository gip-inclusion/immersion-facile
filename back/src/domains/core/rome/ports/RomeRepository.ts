import {
  AppellationAndRomeDto,
  AppellationCode,
  RomeCode,
  RomeDto,
} from "shared";

export interface RomeRepository {
  appellationToCodeMetier(
    romeCodeAppellation: AppellationCode,
  ): Promise<RomeCode | undefined>;
  searchRome: (query: string) => Promise<RomeDto[]>;
  searchAppellation: (query: string) => Promise<AppellationAndRomeDto[]>;
  getAppellationAndRomeDtosFromAppellationCodes: (
    codes: AppellationCode[],
  ) => Promise<AppellationAndRomeDto[]>;
}
