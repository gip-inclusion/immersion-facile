import { ConventionId, ConventionJwtPayload, ForbiddenError } from "shared";

export const throwForbiddenIfNotAllow = (
  conventionId: ConventionId,
  conventionJwtPayload: ConventionJwtPayload,
) => {
  if (conventionJwtPayload.role !== "establishment-tutor")
    throw new ForbiddenError(
      "Only an establishment tutor can create or get an assessment",
    );
  if (conventionId !== conventionJwtPayload.applicationId)
    throw new ForbiddenError(
      "Convention provided in DTO is not the same as application linked to it",
    );
};
