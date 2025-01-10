import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import { conventionSummaryStyles } from "../convention-summary/ConventionSummary.styles";

type WeeklySchedule = {
  period: {
    start: string;
    end: string;
  };
  weeklyHours: number;
  schedule: string[];
}[];
type ConventionWeeklyScheduleProps = {
  weeklySchedule: WeeklySchedule;
  useWrapper: boolean;
};

const hourDisplayedSeparator = "h";
const hoursValueToHoursDisplayed = ({
  hoursValue,
  padWithZero = true,
}: {
  hoursValue: number;
  padWithZero?: boolean;
}): string => {
  const hours = Math.floor(hoursValue);
  const minutes = Math.round((hoursValue - hours) * 60);
  const hoursDisplayed = `${hours < 10 && padWithZero ? `0${hours}` : hours}`;
  if (minutes === 0) return `${hoursDisplayed}${hourDisplayedSeparator}`;
  return `${hoursDisplayed}${hourDisplayedSeparator}${
    minutes < 10 ? `0${minutes}` : minutes
  }`;
};

export const ConventionWeeklySchedule = ({
  weeklySchedule,
  useWrapper,
}: ConventionWeeklyScheduleProps) => {
  const { cx } = useStyles();
  const weeklyScheduleContent = (
    <div className={fr.cx("fr-grid-row")}>
      {weeklySchedule.map((week, index) => (
        <div
          className={fr.cx(
            "fr-col-12",
            "fr-col-md-6",
            "fr-col-lg-4",
            "fr-col-xl-3",
            "fr-my-3v",
          )}
          key={week.period.start}
        >
          <div
            className={cx(
              fr.cx("fr-col-6", "fr-m-0", "fr-text--sm"),
              conventionSummaryStyles.subsectionScheduleWeek,
            )}
          >
            Semaine {index + 1}
          </div>
          {week.period?.start && week.period?.end && (
            <div className={fr.cx("fr-text--xs", "fr-m-0")}>
              Du {week.period.start} au {week.period.end}
            </div>
          )}
          <div aria-hidden="true" className={fr.cx("fr-text--xs", "fr-m-0")}>
            --
          </div>
          <p className={fr.cx("fr-text--xs", "fr-mb-3v")}>
            {hoursValueToHoursDisplayed({
              hoursValue: week.weeklyHours,
              padWithZero: false,
            })}{" "}
            de travail hebdomadaires
          </p>
          <ul
            style={{
              paddingInlineStart: "0",
            }}
          >
            {week.schedule.map((daySchedule) => (
              <li
                key={daySchedule}
                className={cx(
                  fr.cx("fr-text--sm"),
                  conventionSummaryStyles.subsectionScheduleDay,
                )}
              >
                {daySchedule}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
  return useWrapper ? (
    <section
      className={cx(
        fr.cx("fr-p-2w", "fr-my-3w"),
        conventionSummaryStyles.subsectionHighlighted,
      )}
    >
      {weeklyScheduleContent}
    </section>
  ) : (
    weeklyScheduleContent
  );
};
