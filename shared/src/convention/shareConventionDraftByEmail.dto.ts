import type { DeepPartial } from "../utils";
import type { ConventionPresentation } from "./conventionPresentation.dto";

export type ConventionDraftDto = DeepPartial<ConventionPresentation>;

export type ShareConventionDraftByEmailDto = {
  senderEmail: string;
  recipientEmail?: string;
  details?: string;
  convention: ConventionDraftDto;
};
