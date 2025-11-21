import type { ConventionReadDto } from "shared";
import type { VerificationActionWithLink } from "src/app/components/forms/convention/manage-actions/getVerificationActionButtonProps";
import { conventionReadToConventionRouteParams } from "src/app/routes/routeParams/convention";
import { routes } from "src/app/routes/routes";
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
    EDIT_CONVENTION: routes.conventionImmersion({
      conventionId: convention.id,
      jwt: jwt,
      skipIntro: true,
    }).link,

    DUPLICATE_CONVENTION:
      convention.internshipKind === "immersion"
        ? routes.conventionImmersion({
            ...conventionReadToConventionRouteParams(convention),
            skipIntro: true,
          }).link
        : routes.conventionMiniStage(
            conventionReadToConventionRouteParams(convention),
          ).link,

    ACCESS_CONVENTION: routes.conventionDocument({
      jwt: jwt,
      conventionId: convention.id,
    }).link,

    ACCESS_ASSESSMENT: routes.assessmentDocument({
      jwt: jwt,
      conventionId: convention.id,
    }).link,

    FILL_ASSESSMENT: routes.assessment({
      jwt: jwt,
      conventionId: convention.id,
    }).link,

    DECLARE_ABANDONMENT: routes.assessment({
      jwt: jwt,
      conventionId: convention.id,
    }).link,
  };

  return links[verificationAction];
};
