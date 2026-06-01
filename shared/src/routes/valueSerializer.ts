import type { ValueSerializer } from "type-route";
import type { NafCode } from "../naf/naf.dto";
import type { RemoteWorkMode } from "../remoteWorkMode/remoteWorkMode.dto";
import type {
  AppellationAndRomeDto,
  AppellationCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { ScheduleDto } from "../schedule/Schedule.dto";
import { parseStringToJsonOrThrow } from "../utils/string";

const makeValueSerializer = <T>(paramName: string): ValueSerializer<T> => ({
  parse: (raw) => parseStringToJsonOrThrow<T>(raw, paramName),
  stringify: (value) => JSON.stringify(value),
});

export const scheduleSerializer: ValueSerializer<ScheduleDto> =
  makeValueSerializer<ScheduleDto>("schedule");

export const appellationAndRomeDtoSerializer: ValueSerializer<AppellationAndRomeDto> =
  makeValueSerializer<AppellationAndRomeDto>("immersionAppellation");

export const appellationAndRomeDtoArraySerializer: ValueSerializer<
  AppellationAndRomeDto[]
> = makeValueSerializer<AppellationAndRomeDto[]>("appellations");

export const appellationStringSerializer: ValueSerializer<AppellationCode[]> =
  makeValueSerializer<AppellationCode[]>("appellationCodes");

export const nafCodeSerializer: ValueSerializer<NafCode[]> =
  makeValueSerializer<NafCode[]>("nafCodes");

export const remoteWorkModeSerializer: ValueSerializer<RemoteWorkMode[]> =
  makeValueSerializer<RemoteWorkMode[]>("remoteWorkModes");
makeValueSerializer<RemoteWorkMode[]>("remoteWorkModes");
