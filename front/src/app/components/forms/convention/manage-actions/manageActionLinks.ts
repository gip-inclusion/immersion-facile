import type { ConventionReadDto } from "shared";
import { frontRoutes } from "shared";
import type { VerificationActionWithLink } from "src/app/components/forms/convention/manage-actions/getVerificationActionButtonProps";
import type { Link } from "type-route";

export type LinkParams = {
  convention: ConventionReadDto;
  jwt: string;
};

export const linkByAction = (
  verificationAction: VerificationActionWithLink,
  params: LinkParams,
): Link => {
  const { convention, jwt } = params;

  const links: Record<VerificationActionWithLink, Link> = {
    EDIT_CONVENTION: frontRoutes.conventionImmersion({
      conventionId: convention.id,
      jwt: jwt,
      skipIntro: true,
    }).link,

    ACCESS_CONVENTION: frontRoutes.conventionDocument({
      jwt: jwt,
      conventionId: convention.id,
    }).link,

    ACCESS_ASSESSMENT: frontRoutes.assessmentDocument({
      jwt: jwt,
      conventionId: convention.id,
    }).link,

    FILL_ASSESSMENT: frontRoutes.assessment({
      jwt: jwt,
      conventionId: convention.id,
    }).link,

    DECLARE_ABANDONMENT: frontRoutes.assessment({
      jwt: jwt,
      conventionId: convention.id,
    }).link,
  };

  return links[verificationAction];
};
