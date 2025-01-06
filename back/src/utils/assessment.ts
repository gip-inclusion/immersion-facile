import { ConventionId, ConventionJwtPayload, errors } from "shared";

export const throwForbiddenIfNotAllow = (
  conventionId: ConventionId,
  conventionJwtPayload: ConventionJwtPayload,
) => {
  if (conventionJwtPayload.role !== "establishment-tutor")
    throw errors.assessment.forbidden();
  if (conventionId !== conventionJwtPayload.applicationId)
    throw errors.assessment.conventionIdMismatch();
};
