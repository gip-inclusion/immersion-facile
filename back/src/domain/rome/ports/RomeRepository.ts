import { AppellationCode, RomeCode } from "../../../shared/rome";
import {
  AppellationDto,
  RomeDto,
} from "../../../shared/romeAndAppellationDtos/romeAndAppellation.dto";

export interface RomeRepository {
  appellationToCodeMetier(
    romeCodeAppellation: AppellationCode,
  ): Promise<RomeCode | undefined>;
  searchRome: (query: string) => Promise<RomeDto[]>;
  searchAppellation: (query: string) => Promise<AppellationDto[]>;
}
