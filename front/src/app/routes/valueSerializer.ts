import {
  type AppellationAndRomeDto,
  type AppellationCode,
  type NafCode,
  parseStringToJsonOrThrow,
  type RemoteWorkMode,
  type ScheduleDto,
} from "shared";
import type { ValueSerializer } from "type-route";

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
