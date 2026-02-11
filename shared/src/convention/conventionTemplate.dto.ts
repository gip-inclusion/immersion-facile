import type { Flavor } from "../typeFlavors";
import type { UserId } from "../user/user.dto";
import type { OmitFromExistingKeys } from "../utils";
import type { ConventionDraftDto } from "./shareConventionDraftByEmail.dto";

export type ConventionTemplateId = Flavor<string, "ConventionTemplateId">;

export type ConventionTemplate = OmitFromExistingKeys<
  ConventionDraftDto,
  "id"
> & {
  id: ConventionTemplateId;
  name: string;
  userId: UserId;
};
