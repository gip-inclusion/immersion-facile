import { AppellationDto } from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";
import { ScheduleDto } from "src/shared/ScheduleSchema";
import { param, ValueSerializer } from "type-route";

const scheduleSerializer: ValueSerializer<ScheduleDto> = {
  parse: (raw) => JSON.parse(raw),
  stringify: (schedule) => JSON.stringify(schedule),
};

const appellationDtoSerializer: ValueSerializer<AppellationDto> = {
  parse: (raw) => JSON.parse(raw),
  stringify: (appellationDto) => JSON.stringify(appellationDto),
};

export type ApplicationFormKeysInUrl =
  keyof typeof immersionApplicationValuesFromUrl;

export const immersionApplicationValuesFromUrl = {
  email: param.query.optional.string,
  peExternalId: param.query.optional.string,
  firstName: param.query.optional.string,
  lastName: param.query.optional.string,
  phone: param.query.optional.string,
  postalCode: param.query.optional.string,
  emergencyContact: param.query.optional.string,
  emergencyContactPhone: param.query.optional.string,

  siret: param.query.optional.string,
  businessName: param.query.optional.string,
  mentor: param.query.optional.string,
  mentorPhone: param.query.optional.string,
  mentorEmail: param.query.optional.string,
  immersionAddress: param.query.optional.string,
  agencyId: param.query.optional.string,

  immersionObjective: param.query.optional.string,
  immersionActivities: param.query.optional.string,
  immersionSkills: param.query.optional.string,
  sanitaryPreventionDescription: param.query.optional.string,
  workConditions: param.query.optional.string,

  sanitaryPrevention: param.query.optional.boolean,
  individualProtection: param.query.optional.boolean,

  dateStart: param.query.optional.string,
  dateEnd: param.query.optional.string,

  schedule: param.query.optional.ofType(scheduleSerializer),
  immersionAppellation: param.query.optional.ofType(appellationDtoSerializer),
};
