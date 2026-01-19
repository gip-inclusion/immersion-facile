import { v4 as uuidV4 } from "uuid";
import type { Email } from "../email/email.dto";
import type { Flavor } from "../typeFlavors";
import {
  type DeepPartial,
  type OmitFromExistingKeys,
  replaceEmptyValuesByUndefinedFromObject,
} from "../utils";
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

export const toConventionDraftDto = ({
  convention,
}: {
  convention: CreateConventionPresentationInitialValues;
}): ConventionDraftDto => ({
  ...replaceEmptyValuesByUndefinedFromObject(convention),
  id: convention.fromConventionDraftId ?? uuidV4(),
});
