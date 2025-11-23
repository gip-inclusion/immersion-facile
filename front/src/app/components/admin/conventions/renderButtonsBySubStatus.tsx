/** biome-ignore-all lint/complexity/useLiteralKeys: false positive */
import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { Button } from "@codegouvfr/react-dsfr/Button";
import type { ReactElement } from "react";
import { ButtonWithSubMenu } from "react-design-system";
import type { ButtonConfiguration } from "src/app/components/forms/convention/manage-actions/getButtonConfigBySubStatus";
import type { ConventionSubStatus } from "src/app/utils/conventionSubStatus";
import { match, P } from "ts-pattern";
import { ModalWrapper } from "../../forms/convention/manage-actions/ManageActionModalWrapper";

export type ButtonArea = (typeof allAreas)[number];

const allAreas = [
  "OtherActionArea",
  "CancelationArea",
  "EditionArea",
  "ValidationArea",
  "AssessmentArea",
  "ConventionArea",
  "SignatureArea",
] as const;

const getButtonWithSubMenuLabels: (
  subStatus: ConventionSubStatus,
) => Record<ButtonArea, string> = (subStatus: ConventionSubStatus) => {
  const otherActionLabel =
    subStatus === "cancelledWithBroadcastError" ||
    subStatus === "cancelledWithoutBroadcastError" ||
    subStatus === "deprecatedWithBroadcastError" ||
    subStatus === "deprecatedWithoutBroadcastError" ||
    subStatus === "rejectedWithBroadcastError" ||
    subStatus === "rejectedWithoutBroadcastError"
      ? "Gérer la synchronisation"
      : "Autres actions";

  return {
    CancelationArea: "Annulation",
    EditionArea: "Édition",
    ValidationArea: "Validation",
    AssessmentArea: "Bilan",
    ConventionArea: "Convention",
    OtherActionArea: otherActionLabel,
    SignatureArea: "Signature",
  };
};

const getPrimaryAreaBySubStatus = (
  subStatus: ConventionSubStatus,
  isSignVisible: boolean,
): ButtonArea => {
  return match(subStatus)
    .with(
      P.union(
        "readyToSignWithBroadcastError",
        "readyToSignWithoutBroadcastError",
        "partiallySignedWithBroadcastError",
        "partiallySignedWithoutBroadcastError",
      ),
      (): ButtonArea => (isSignVisible ? "SignatureArea" : "EditionArea"),
    )
    .with(
      P.union(
        "inReviewWithSingleValidationWithBroadcastError",
        "inReviewWithSingleValidationWithoutBroadcastError",
        "inReviewWithDoubleValidationWithBroadcastError",
        "inReviewWithDoubleValidationWithoutBroadcastError",
        "acceptedByCounsellorWithBroadcastError",
        "acceptedByCounsellorWithoutBroadcastError",
      ),
      (): ButtonArea => "ValidationArea",
    )
    .with(
      P.union(
        "acceptedByValidatorWithAssessmentWithBroadcastError",
        "acceptedByValidatorWithAssessmentWithoutBroadcastError",
        "acceptedByValidatorWithoutAssessmentDidNotStartWithBroadcastError",
        "acceptedByValidatorWithoutAssessmentDidNotStartWithoutBroadcastError",
        "acceptedByValidatorWithoutAssessmentDidStartEndingInOneDayOrMoreWithBroadcastError",
        "acceptedByValidatorWithoutAssessmentDidStartEndingInOneDayOrMoreWithoutBroadcastError",
        "acceptedByValidatorWithoutAssessmentDidStartEndingTomorrowOrAlreadyEndedWithBroadcastError",
        "acceptedByValidatorWithoutAssessmentDidStartEndingTomorrowOrAlreadyEndedWithoutBroadcastError",
      ),
      (): ButtonArea => "ConventionArea",
    )
    .with(
      P.union(
        "rejectedWithBroadcastError",
        "rejectedWithoutBroadcastError",
        "cancelledWithBroadcastError",
        "cancelledWithoutBroadcastError",
        "deprecatedWithBroadcastError",
        "deprecatedWithoutBroadcastError",
      ),
      (): ButtonArea => "OtherActionArea",
    )
    .exhaustive();
};

type RenderButtonsBySubStatusParams = {
  buttonConfig: ButtonConfiguration[];
  subStatus: ConventionSubStatus;
};

type RenderedButtons = {
  leftButtons: ReactElement[];
  rightButtons: ReactElement[];
  modals: ReactElement[];
};

const getAreasConfig = (
  buttonsConfig: ButtonConfiguration[],
): Record<ButtonArea, ButtonConfiguration[]> => {
  return {
    CancelationArea: buttonsConfig.filter(
      (item) => item.buttonArea === "CancelationArea",
    ),
    EditionArea: buttonsConfig.filter(
      (item) => item.buttonArea === "EditionArea",
    ),
    ValidationArea: buttonsConfig.filter(
      (item) => item.buttonArea === "ValidationArea",
    ),
    AssessmentArea: buttonsConfig.filter(
      (item) => item.buttonArea === "AssessmentArea",
    ),
    ConventionArea: buttonsConfig.filter(
      (item) => item.buttonArea === "ConventionArea",
    ),
    OtherActionArea: buttonsConfig.filter(
      (item) => item.buttonArea === "OtherActionArea",
    ),
    SignatureArea: buttonsConfig.filter(
      (item) => item.buttonArea === "SignatureArea",
    ),
  };
};

const getRightAndLeftAreas = (
  buttonsConfig: ButtonConfiguration[],
  subStatus: ConventionSubStatus,
  isSignVisible: boolean,
): {
  leftAreas: ButtonArea[];
  rightAreas: ButtonArea[];
} => {
  const areasConfig = getAreasConfig(buttonsConfig);
  const primaryArea = getPrimaryAreaBySubStatus(subStatus, isSignVisible);

  const shouldShowOtherActionOnLeft =
    areasConfig["OtherActionArea"].length > 0 &&
    primaryArea !== "OtherActionArea";

  const leftAreas: ButtonArea[] = shouldShowOtherActionOnLeft
    ? ["OtherActionArea"]
    : [];

  const rightAreasWithoutPrimary = allAreas.filter(
    (area) => area !== primaryArea && !leftAreas.includes(area),
  );

  const rightAreas: ButtonArea[] = [...rightAreasWithoutPrimary, primaryArea];

  return { leftAreas, rightAreas };
};

export const renderButtonsBySubStatus = ({
  buttonConfig,
  subStatus,
}: RenderButtonsBySubStatusParams): RenderedButtons => {
  const buttonsConfig = buttonConfig.filter(
    (config) => config.isVisibleForUserRights,
  );
  const isSignVisible = buttonsConfig.some(
    (config) =>
      config.buttonArea === "SignatureArea" && config.isVisibleForUserRights,
  );
  const primaryArea = getPrimaryAreaBySubStatus(subStatus, isSignVisible);

  const areasConfig = getAreasConfig(buttonsConfig);
  const { leftAreas, rightAreas } = getRightAndLeftAreas(
    buttonsConfig,
    subStatus,
    isSignVisible,
  );

  const renderButtonsForArea = (
    buttonConfigurations: ButtonConfiguration[],
    area: ButtonArea,
    position: "left" | "right",
  ): { buttons: ReactElement[]; modals: ReactElement[] } => {
    if (buttonConfigurations.length === 0) {
      return { buttons: [], modals: [] };
    }

    const priority: ButtonProps["priority"] =
      area === primaryArea ? "primary" : "secondary";

    if (buttonConfigurations.length === 1) {
      const { props } = buttonConfigurations[0];

      const { buttonProps } = props;

      const buttonElement = (
        <Button key={buttonProps.id} {...buttonProps} priority={priority} />
      );

      const modalElement = props.modalWrapperProps ? (
        <ModalWrapper
          key={`modal-${buttonProps.id}`}
          {...props.modalWrapperProps}
        />
      ) : null;

      return {
        buttons: [buttonElement],
        modals: modalElement ? [modalElement] : [],
      };
    }

    const navItems = buttonConfigurations.map(({ props }) => props.buttonProps);

    const modals = buttonConfigurations
      .map(
        (config) =>
          config.props.modalWrapperProps && (
            <ModalWrapper
              key={`modal-${config.props.buttonProps.id}`}
              {...config.props.modalWrapperProps}
            />
          ),
      )
      .filter((modal) => modal !== null);

    const buttonWithSubMenu = (
      <ButtonWithSubMenu
        key={area}
        buttonLabel={getButtonWithSubMenuLabels(subStatus)[area]}
        buttonIconId="fr-icon-arrow-down-s-line"
        iconPosition="right"
        navItems={navItems}
        priority={priority}
        {...(position === "right"
          ? { openedTopRight: true }
          : { openedTopLeft: true })}
      />
    );

    return { buttons: [buttonWithSubMenu], modals };
  };

  const leftButtonsResults = leftAreas
    .filter((area) => areasConfig[area].length > 0)
    .map((area) => renderButtonsForArea(areasConfig[area], area, "left"));

  const rightButtonsResults = rightAreas
    .filter((area) => areasConfig[area].length > 0)
    .map((area) => renderButtonsForArea(areasConfig[area], area, "right"));

  const leftButtons = leftButtonsResults.flatMap((result) => result.buttons);
  const rightButtons = rightButtonsResults.flatMap((result) => result.buttons);
  const modals = [
    ...leftButtonsResults.flatMap((result) => result.modals),
    ...rightButtonsResults.flatMap((result) => result.modals),
  ];

  return {
    leftButtons,
    rightButtons,
    modals,
  };
};
