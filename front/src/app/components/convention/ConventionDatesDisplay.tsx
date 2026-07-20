import { type ConventionDto, toDisplayedDate } from "shared";

export const ConventionDatesDisplay = ({
  convention: { dateEnd, dateStart },
}: {
  convention: Pick<ConventionDto, "dateStart" | "dateEnd">;
}) => (
  <>
    Du&nbsp;
    {toDisplayedDate({
      date: new Date(dateStart),
      withHours: false,
    })}
    <br />
    Au&nbsp;
    {toDisplayedDate({
      date: new Date(dateEnd),
      withHours: false,
    })}
  </>
);
