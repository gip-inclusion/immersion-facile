import { ValueSerializer } from "type-route";
import { AppellationAndRomeDto } from "shared";

export const appellationDtoSerializer: ValueSerializer<AppellationAndRomeDto> =
  {
    parse: (raw) => JSON.parse(raw),
    stringify: (appellationDto) => JSON.stringify(appellationDto),
  };
