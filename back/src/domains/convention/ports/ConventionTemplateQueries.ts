import type {
  ConventionTemplate,
  ConventionTemplateId,
  DateTimeIsoString,
} from "shared";

export interface ConventionTemplateQueries {
  getById(id: ConventionTemplateId): Promise<ConventionTemplate | undefined>;

  upsert(
    conventionTemplate: ConventionTemplate,
    now: DateTimeIsoString,
  ): Promise<void>;
}
