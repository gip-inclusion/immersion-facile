import type {
  ConventionTemplate,
  ConventionTemplateId,
  DateTimeIsoString,
  UserId,
} from "shared";

export type GetConventionTemplatesParams = {
  ids?: ConventionTemplateId[];
  userIds?: UserId[];
};

export interface ConventionTemplateQueries {
  get(params: GetConventionTemplatesParams): Promise<ConventionTemplate[]>;

  upsert(
    conventionTemplate: ConventionTemplate,
    now: DateTimeIsoString,
  ): Promise<void>;
}
