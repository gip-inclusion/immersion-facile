import type {
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
  getAppellationAndRomeDtosFromAppellationCodesIfExist: (
    codes: AppellationCode[],
  ) => Promise<AppellationAndRomeDto[]>;
  getAppellationAndRomeLegacyV3: (
    appellationCode: AppellationCode,
  ) => Promise<AppellationAndRomeDto | undefined>;
}
