import { formatDuration, intervalToDuration } from "date-fns";
import { fr as frLocale } from "date-fns/locale";

export const oneMinuteInSeconds = 60;
export const oneHourInSeconds = 60 * oneMinuteInSeconds;
export const oneDayInSecond = oneHourInSeconds * 24;
export const fiveMinutesInSeconds = 5 * oneMinuteInSeconds;

type DurationFormat = "minutes" | "hours" | "days";

export const displayDuration = (
  durationInSeconds: number,
  format: DurationFormat,
) =>
  formatDuration(
    intervalToDuration({ start: 0, end: durationInSeconds * 1000 }),
    {
      format: [format],
      locale: frLocale,
    },
  );
