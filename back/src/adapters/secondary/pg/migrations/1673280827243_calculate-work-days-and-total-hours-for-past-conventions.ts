import { addDays, parseISO } from "date-fns";
import { MigrationBuilder } from "node-pg-migrate";

const batchSize = 100;

export async function up(pgm: MigrationBuilder): Promise<void> {
  const getIdsResponse = await pgm.db.query(`SELECT id FROM conventions`);
  const conventionIds: string[] = getIdsResponse.rows.map(({ id }) => id);
  for (let i = 0; i < conventionIds.length; i += batchSize) {
    const getSchedulesResponse = await pgm.db.query(
      `SELECT id, schedule FROM conventions WHERE id = any(string_to_array($1,',')::uuid[])`,
      [conventionIds.slice(i, i + batchSize).join(",")],
    );

    const idAndSchedules: { id: string; schedule: any }[] =
      getSchedulesResponse.rows;

    idAndSchedules.forEach((currentIdAndSchedules) => {
      currentIdAndSchedules.schedule = {
        ...currentIdAndSchedules.schedule,
        totalHours: calculateTotalImmersionHoursFromComplexSchedule(
          currentIdAndSchedules.schedule.complexSchedule,
        ),
        workedDays: calculateNumberOfWorkedDays(
          currentIdAndSchedules.schedule.complexSchedule,
        ),
      };
    });

    await pgm.db.query(`
      UPDATE conventions
        SET
          schedule = cast(updated.schedule AS JSONB)
      FROM (VALUES
        ${idAndSchedules
          .map(({ id, schedule }) => `('${id}', '${JSON.stringify(schedule)}')`)
          .join(",\n")}
      ) AS updated(id , schedule)
      WHERE (conventions.id = cast(updated.id AS UUID))
    `);
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  const getIdsResponse = await pgm.db.query(`SELECT id FROM conventions`);
  const conventionIds: string[] = getIdsResponse.rows.map(({ id }) => id);
  for (let i = 0; i < conventionIds.length; i += batchSize) {
    const getSchedulesResponse = await pgm.db.query(
      `SELECT id, schedule FROM conventions WHERE id = any(string_to_array($1,',')::uuid[])`,
      [conventionIds.slice(i, i + batchSize).join(",")],
    );

    const idAndSchedules: { id: string; schedule: any }[] =
      getSchedulesResponse.rows;

    idAndSchedules.forEach((idAndSchedule) => {
      const { totalHours, workedDays, ...rest } = idAndSchedule.schedule;
      idAndSchedule.schedule = {
        ...rest,
      };
    });

    await pgm.db.query(`
      UPDATE conventions
        SET
          schedule = cast(updated.schedule AS JSONB)
      FROM (VALUES
        ${idAndSchedules
          .map(({ id, schedule }) => `('${id}', '${JSON.stringify(schedule)}')`)
          .join(",\n")}
      ) AS updated(id , schedule)
      WHERE (conventions.id = cast(updated.id AS UUID))
    `);
  }
}

export const calculateTotalImmersionHoursFromComplexSchedule = (
  complexSchedule: any[],
): number => {
  const dates = complexSchedule.map((v) => v.date);
  const dateStart = dates.sort()[0];
  const dateEnd = dates.reverse()[0];
  return calculateTotalImmersionHoursBetweenDateComplex({
    complexSchedule,
    dateStart,
    dateEnd,
  });
};

const calculateTotalImmersionHoursBetweenDateComplex = ({
  dateStart,
  dateEnd,
  complexSchedule,
}: any): number => {
  const start = parseISO(dateStart);
  const end = parseISO(dateEnd);
  let totalOfMinutes = 0;
  for (
    let currentDate = start;
    currentDate <= end;
    currentDate = addDays(currentDate, 1)
  ) {
    const date = complexSchedule.find(
      (dailySchedule: any) =>
        parseISO(dailySchedule.date).getDate() === currentDate.getDate() &&
        parseISO(dailySchedule.date).getMonth() === currentDate.getMonth() &&
        parseISO(dailySchedule.date).getFullYear() ===
          currentDate.getFullYear(),
    );
    if (date) totalOfMinutes += minutesInDay(date.timePeriods);
  }
  return totalOfMinutes / 60;
};

const minutesInDay = (timePeriods: any[]): number =>
  timePeriods.reduce(
    (totalMinutes, period) => totalMinutes + timePeriodDurationMinutes(period),
    0,
  );

const periodStringToHoursMinutes = (s: string) => {
  const [hour, minute] = s.split(":").map(Number);
  return [hour, minute];
};

const timePeriodDurationMinutes = (period: any) => {
  const [startHour, startMinute] = periodStringToHoursMinutes(period.start);
  const [endHour, endMinute] = periodStringToHoursMinutes(period.end);
  return Math.max(0, (endHour - startHour) * 60 + endMinute - startMinute);
};

export const calculateNumberOfWorkedDays = (complexSchedule: any[]): number =>
  complexSchedule.filter((v) => v.timePeriods.length > 0).length;
