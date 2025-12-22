import type { Flavor } from "../typeFlavors";
import type { DeepPartial, OmitFromExistingKeys } from "../utils";
import type { InternshipKind } from "./convention.dto";
import type { ConventionPresentation } from "./conventionPresentation.dto";

export type ConventionDraftId = Flavor<string, "ConventionDraftId">;

export type ConventionDraftDto = DeepPartial<
  OmitFromExistingKeys<ConventionPresentation, "id">
> & {
  id: ConventionDraftId;
  internshipKind: InternshipKind;
};

export type ShareConventionDraftByEmailDto = {
  senderEmail: string;
  recipientEmail?: string;
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
  convention: ConventionPresentation;
}): ConventionDraftDto => ({
  ...replaceEmptyStringByUndefined(convention),
  id: convention.id as ConventionDraftId,
});
