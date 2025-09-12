import type { CreateDiscussionDto } from "shared";

export type ContactEstablishmentPublicV3Dto = CreateDiscussionDto;

export const contactEstablishmentPublicV3ToDomain = (
  contactRequest: ContactEstablishmentPublicV3Dto,
): CreateDiscussionDto => contactRequest;
