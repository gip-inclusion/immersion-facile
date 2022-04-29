import { AppellationCode, RomeCode } from "shared/src/rome";
import {
  AppellationDto,
  RomeDto,
} from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";

export interface RomeRepository {
  appellationToCodeMetier(
    romeCodeAppellation: AppellationCode,
  ): Promise<RomeCode | undefined>;
  searchRome: (query: string) => Promise<RomeDto[]>;
  searchAppellation: (query: string) => Promise<AppellationDto[]>;
}
