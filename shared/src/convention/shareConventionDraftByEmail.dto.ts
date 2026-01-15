import { v4 as uuidV4 } from "uuid";
import type { Email } from "../email/email.dto";
import type { Flavor } from "../typeFlavors";
import type { DeepPartial, OmitFromExistingKeys } from "../utils";
import type { InternshipKind } from "./convention.dto";
import type { CreateConventionPresentationInitialValues } from "./conventionPresentation.dto";

export type ConventionDraftId = Flavor<string, "ConventionDraftId">;

export type ConventionDraftDto = DeepPartial<
  OmitFromExistingKeys<CreateConventionPresentationInitialValues, "id">
> & {
  id: ConventionDraftId;
  internshipKind: InternshipKind;
};

export type ShareConventionDraftByEmailDto = {
  senderEmail: Email;
  recipientEmail?: Email;
  details?: string;
  conventionDraft: ConventionDraftDto;
};

const replaceEmptyStringByUndefined = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return (obj === "" ? undefined : obj) as T;
  if (Array.isArray(obj)) return obj.map(replaceEmptyStringByUndefined) as T;
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        replaceEmptyStringByUndefined(value),
      ]),
    ) as T;
  }
  return obj;
};

export const toConventionDraftDto = ({
  convention,
}: {
  convention: CreateConventionPresentationInitialValues;
}): ConventionDraftDto => ({
  ...replaceEmptyStringByUndefined(convention),
  id: convention.fromConventionDraftId ?? uuidV4(),
});
