import { AppellationCode, AppellationDto } from "shared";

export const getDefaultAppellationCode = (
  appellations: AppellationDto[],
  appellationInParams: AppellationCode,
) => {
  if (appellationInParams) {
    return appellationInParams;
  }
  return appellations.length > 1 ? "" : appellations[0].appellationCode;
};
