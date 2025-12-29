import type { DeepPartial } from "../utils";
import type { ConventionPresentation } from "./conventionPresentation.dto";

export type SharedConventionDto = DeepPartial<ConventionPresentation>;

export type ShareConventionLinkByEmailDto = {
  senderEmail: string;
  recipientEmail?: string;
  details?: string;
  convention: SharedConventionDto;
};
