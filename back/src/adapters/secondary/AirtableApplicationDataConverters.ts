import { FieldSet } from "airtable";
import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import {
  ApplicationSource,
  applicationSourceFromString,
  ApplicationStatus,
  applicationStatusFromString,
  ImmersionApplicationDto,
} from "../../shared/ImmersionApplicationDto";
import {
  emptySchedule,
  LegacyScheduleDto,
  ScheduleDto,
  Weekday,
} from "../../shared/ScheduleSchema";
import {
  convertToFrenchNamedDays,
  isArrayOfWeekdays,
  prettyPrintSchedule,
} from "../../shared/ScheduleUtils";

const readString = (fields: FieldSet, fieldName: string): string => {
  const value = fields[fieldName] || "";
  if (typeof value !== "string")
    throw new Error(`Inavlid field "${fieldName}": ${value}`);
  return value;
};

export const readArrayOfWeekdays = (
  fields: FieldSet,
  fieldName: string,
): Weekday[] => {
  const value = fields[fieldName] || [];
  if (!isArrayOfWeekdays(value))
    throw new Error(`Invalid field "${fieldName}": ${value}`);
  return value as Weekday[];
};

const readNumber = (fields: FieldSet, fieldName: string): number => {
  const value = fields[fieldName] || 0;
  if (typeof value !== "number")
    throw new Error(`Inavlid field "${fieldName}": ${value}`);
  return value;
};

const readBoolean = (fields: FieldSet, fieldName: string): boolean => {
  const value = fields[fieldName] || false;
  if (typeof value !== "boolean")
    throw new Error(`Inavlid field "${fieldName}": ${value}`);
  return value;
};

const readApplicationStatus = (
  fields: FieldSet,
  fieldName: string,
): ApplicationStatus =>
  applicationStatusFromString(readString(fields, fieldName));

const readApplicationSource = (
  fields: FieldSet,
  fieldName: string,
): ApplicationSource =>
  applicationSourceFromString(readString(fields, fieldName));

const readScheduleDto = (fields: FieldSet, fieldName: string): ScheduleDto =>
  JSON.parse(readString(fields, fieldName));
const scheduleDtoToString = JSON.stringify;

const readLegacyScheduleDto = (
  fields: FieldSet,
  workdaysFieldName: string,
  descriptionFieldName: string,
): LegacyScheduleDto | undefined => {
  const workdays = readArrayOfWeekdays(fields, workdaysFieldName);
  const description = readString(fields, descriptionFieldName);
  if (!workdays && !description) return undefined;
  return { workdays, description };
};

const readOuiNon = (fields: FieldSet, fieldName: string) => {
  const value = readString(fields, fieldName);
  if (value === "oui") return true;
  if (value === "non") return false;
  throw new Error(`Invalid oui/non value: ${value}`);
};
const booleanToOuiNon = (value: boolean) => (value ? "oui" : "non");
const siretToNumber = parseInt;
const numberToSiret = (value: number): string => {
  return value.toLocaleString("fr-FR", {
    minimumIntegerDigits: 14,
    useGrouping: false,
  });
};

export type AirtableApplicationDataConverter = {
  entityToFieldSet: (entity: ImmersionApplicationEntity) => FieldSet;
  fieldSetToEntity: (fields: FieldSet) => ImmersionApplicationEntity;
};

export const genericApplicationDataConverter: AirtableApplicationDataConverter =
  {
    entityToFieldSet: (entity: ImmersionApplicationEntity): FieldSet => {
      const dto = entity.toDto();
      return {
        ...dto,
        schedule: scheduleDtoToString(dto.schedule),
        legacySchedule: undefined, // I had to add this line to fix a strange type error. Not sure if it is Ok ...
      } as FieldSet;
    },

    fieldSetToEntity: (fields: FieldSet): ImmersionApplicationEntity => {
      return ImmersionApplicationEntity.create({
        id: readString(fields, "id"),
        status: readApplicationStatus(fields, "status"),
        source: readApplicationSource(fields, "source"),
        email: readString(fields, "email"),
        phone: readString(fields, "phone"),
        firstName: readString(fields, "firstName"),
        lastName: readString(fields, "lastName"),
        dateSubmission: readString(fields, "dateSubmission"),
        dateStart: readString(fields, "dateStart"),
        dateEnd: readString(fields, "dateEnd"),
        businessName: readString(fields, "businessName"),
        siret: readString(fields, "siret"),
        mentor: readString(fields, "mentor"),
        mentorPhone: readString(fields, "mentorPhone"),
        mentorEmail: readString(fields, "mentorEmail"),
        schedule: readScheduleDto(fields, "schedule") || emptySchedule,
        legacySchedule: undefined,
        immersionAddress: readString(fields, "immersionAddress"),
        individualProtection: readBoolean(fields, "individualProtection"),
        sanitaryPrevention: readBoolean(fields, "sanitaryPrevention"),
        sanitaryPreventionDescription: readString(
          fields,
          "sanitaryPreventionDescription",
        ),
        immersionObjective: readString(fields, "immersionObjective"),
        immersionProfession: readString(fields, "immersionProfession"),
        immersionActivities: readString(fields, "immersionActivities"),
        immersionSkills: readString(fields, "immersionSkills"),
        beneficiaryAccepted: readBoolean(fields, "beneficiaryAccepted"),
        enterpriseAccepted: readBoolean(fields, "enterpriseAccepted"),
      });
    },
  };

const legacyLabels = {
  firstName: "Prénom",
  lastName: "Nom",
  email: "Courriel",
  phone: "Portable (tel. 1 ou 2)",
  siret:
    "N° de SIRET de l'organisme d'accueil (entreprise, association, service public ...)",
  businessName: "Indiquez le nom (raison sociale) de l'établissement d'accueil",
  mentor: "Indiquez le prénom, nom et fonction du tuteur :",
  mentorPhone: "Tel tuteur",
  mentorEmail: "mail tuteur",
  dateStart: "Date de début de l'immersion :",
  dateEnd: "Date de fin de l'immersion :",
  legacyScheduleWorkdays:
    "Journées pendant lesquelles l'immersion va se dérouler",
  legacyScheduleDescription: "Indiquez les horaires de l'immersion :",
  individualProtection:
    "Un équipement de protection individuelle est-il fourni pour l’immersion ?",
  sanitaryPrevention:
    "D’autres mesures de prévention sont-elles prévues pour l’immersion ?",
  sanitaryPreventionDescription: "Si oui, précisez-les  :",
  immersionAddress:
    "Adresse du lieu où se fera l'immersion (Lieu d’exécution (si différent de l’adresse de la structure d’accueil)",
  immersionObjective: "Objectif PMSMP",
  immersionProfession: "Intitulé du poste/métier observé pendant l'immersion :",
  immersionSkills:
    "Compétences observées/évaluées : (ex: communiquer à l'oral, résoudre des problèmes, travailler en équipe)",
  immersionActivities:
    "Activités observées/pratiquées : (ex : mise en rayon, accueil et aide à la clientèle)",
  beneficiaryAccepted: "Obligations des parties (bénéficiaire)",
  enterpriseAccepted: "Obligations des parties (structure d'accueil)",

  // internals
  id: "id",
  status: "status",
  source: "source",
  dateSubmission: "dateSubmission",
  schedule: "schedule",
};

export const legacyApplicationDataConverter: AirtableApplicationDataConverter =
  {
    entityToFieldSet: (entity: ImmersionApplicationEntity): FieldSet => {
      const dto = entity.toDto();

      const fields: Record<string, any> = {};
      fields[legacyLabels.firstName] = dto.firstName;
      fields[legacyLabels.lastName] = dto.lastName;
      fields[legacyLabels.email] = dto.email;
      fields[legacyLabels.phone] = dto.phone || "";
      fields[legacyLabels.siret] = siretToNumber(dto.siret);
      fields[legacyLabels.businessName] = dto.businessName;
      fields[legacyLabels.mentor] = dto.mentor;
      fields[legacyLabels.mentorPhone] = dto.mentorPhone;
      fields[legacyLabels.mentorEmail] = dto.mentorEmail;
      fields[legacyLabels.dateStart] = dto.dateStart;
      fields[legacyLabels.dateEnd] = dto.dateEnd;

      if (dto.legacySchedule) {
        fields[legacyLabels.legacyScheduleWorkdays] =
          dto.legacySchedule.workdays;
        fields[legacyLabels.legacyScheduleDescription] =
          dto.legacySchedule.description;
      } else {
        fields[legacyLabels.legacyScheduleWorkdays] = convertToFrenchNamedDays(
          dto.schedule,
        );
        fields[legacyLabels.legacyScheduleDescription] = prettyPrintSchedule(
          dto.schedule,
        );
      }

      fields[legacyLabels.individualProtection] = booleanToOuiNon(
        dto.individualProtection,
      );
      fields[legacyLabels.sanitaryPrevention] = booleanToOuiNon(
        dto.sanitaryPrevention,
      );
      fields[legacyLabels.sanitaryPreventionDescription] =
        dto.sanitaryPreventionDescription || "";
      fields[legacyLabels.immersionAddress] = dto.immersionAddress || "";
      fields[legacyLabels.immersionObjective] =
        dto.immersionObjective || undefined;
      fields[legacyLabels.immersionProfession] = dto.immersionProfession;
      fields[legacyLabels.immersionSkills] = dto.immersionSkills || "";
      fields[legacyLabels.immersionActivities] = dto.immersionActivities;
      fields[legacyLabels.beneficiaryAccepted] = booleanToOuiNon(
        dto.beneficiaryAccepted,
      );
      fields[legacyLabels.enterpriseAccepted] = booleanToOuiNon(
        dto.enterpriseAccepted,
      );

      // internals
      fields[legacyLabels.id] = dto.id;
      fields[legacyLabels.status] = dto.status;
      fields[legacyLabels.source] = dto.source;
      fields[legacyLabels.dateSubmission] = dto.dateSubmission;
      fields[legacyLabels.schedule] = scheduleDtoToString(dto.schedule);

      return fields;
    },

    fieldSetToEntity: (fields: FieldSet): ImmersionApplicationEntity => {
      const dto: ImmersionApplicationDto = {
        firstName: readString(fields, legacyLabels.firstName),
        lastName: readString(fields, legacyLabels.lastName),
        email: readString(fields, legacyLabels.email),
        phone: readString(fields, legacyLabels.phone),
        siret: numberToSiret(readNumber(fields, legacyLabels.siret)),
        businessName: readString(fields, legacyLabels.businessName),
        mentor: readString(fields, legacyLabels.mentor),
        mentorPhone: readString(fields, legacyLabels.mentorPhone),
        mentorEmail: readString(fields, legacyLabels.mentorEmail),
        dateStart: readString(fields, legacyLabels.dateStart),
        dateEnd: readString(fields, legacyLabels.dateEnd),
        legacySchedule: readLegacyScheduleDto(
          fields,
          legacyLabels.legacyScheduleWorkdays,
          legacyLabels.legacyScheduleDescription,
        ),
        individualProtection: readOuiNon(
          fields,
          legacyLabels.individualProtection,
        ),
        sanitaryPrevention: readOuiNon(fields, legacyLabels.sanitaryPrevention),
        sanitaryPreventionDescription: readString(
          fields,
          legacyLabels.sanitaryPreventionDescription,
        ),
        immersionAddress: readString(fields, legacyLabels.immersionAddress),
        immersionObjective: readString(fields, legacyLabels.immersionObjective),
        immersionProfession: readString(
          fields,
          legacyLabels.immersionProfession,
        ),
        immersionSkills: readString(fields, legacyLabels.immersionSkills),
        immersionActivities: readString(
          fields,
          legacyLabels.immersionActivities,
        ),
        beneficiaryAccepted: readOuiNon(
          fields,
          legacyLabels.beneficiaryAccepted,
        ),
        enterpriseAccepted: readOuiNon(fields, legacyLabels.enterpriseAccepted),

        // internals
        id: readString(fields, legacyLabels.id),
        status: readApplicationStatus(fields, legacyLabels.status),
        source: readApplicationSource(fields, legacyLabels.source),
        dateSubmission: readString(fields, legacyLabels.dateSubmission),
        schedule:
          readScheduleDto(fields, legacyLabels.schedule) || emptySchedule,
      };
      return ImmersionApplicationEntity.create(dto);
    },
  };
