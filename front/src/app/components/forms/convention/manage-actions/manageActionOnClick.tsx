import {
  type AbsoluteUrl,
  absoluteUrlSchema,
  type ConventionDraftDto,
  type ConventionReadDto,
  toConventionDraftDto,
} from "shared";
import type { VerificationActionWithOnClick } from "src/app/components/forms/convention/manage-actions/getVerificationActionButtonProps";
import { routes } from "src/app/routes/routes";

export type OnClickWithoutModalParams = {
  convention: ConventionReadDto;
  onActionClick: (params: {
    conventionDraft: ConventionDraftDto;
    redirectUrl: AbsoluteUrl;
  }) => void;
};

export const onClickByAction = (
  verificationAction: VerificationActionWithOnClick,
  params: OnClickWithoutModalParams,
): (() => void) => {
  const { convention, onActionClick } = params;

  const actions: Record<VerificationActionWithOnClick, () => void> = {
    DUPLICATE_CONVENTION: () => {
      const conventionDraft = toConventionDraftDto({ convention });
      const redirectPath =
        convention.internshipKind === "immersion"
          ? routes.conventionImmersion({
              skipIntro: true,
              conventionDraftId: conventionDraft.id,
            }).href
          : routes.conventionMiniStage({
              conventionDraftId: conventionDraft.id,
            }).href;

      onActionClick({
        conventionDraft,
        redirectUrl: absoluteUrlSchema.parse(
          `${window.location.origin}${redirectPath}`,
        ),
      });
    },
  };

  return actions[verificationAction];
};
