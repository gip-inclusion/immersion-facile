import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useStyles } from "tss-react/dsfr";
import { SectionConventionNextSteps } from "../section-convention-next-steps/SectionConventionNextSteps";
import Styles from "./SubmitConfirmationSection.styles";

type SubmitConfirmationSectionProps = {
  idToCopy: string;
  onCopyButtonClick: (stringToCopy: string) => void;
  copyButtonLabel: string;
  copyButtonIsDisabled: boolean;
};

export const SubmitConfirmationSection = ({
  idToCopy,
  onCopyButtonClick,
  copyButtonLabel,
  copyButtonIsDisabled,
}: SubmitConfirmationSectionProps) => {
  const { cx } = useStyles();
  return (
    <div className={cx(fr.cx("fr-container"), Styles.root)}>
      <div className={fr.cx("fr-py-5w")}>
        <h1 className={cx(fr.cx("fr-mb-md-7w"), Styles.title)}>
          Votre demande de convention a bien été envoyée !
        </h1>
        <p className={cx(fr.cx("fr-mb-4w", "fr-mb-md-7w"), Styles.description)}>
          Conservez précieusement l'identifiant de votre convention, il vous
          permettra de la retrouver en cas de problème :
        </p>
        <div
          className={cx(
            fr.cx("fr-grid-row", "fr-grid-row--center", "fr-grid-row--middle"),
            Styles.copyContent,
          )}
        >
          <strong className={fr.cx("fr-h2", "fr-mb-0")}>{idToCopy}</strong>
          <Button
            disabled={copyButtonIsDisabled}
            onClick={() => onCopyButtonClick(idToCopy)}
            priority="secondary"
            size="large"
            className={fr.cx(
              "fr-btn",
              "fr-btn--sm",
              "fr-icon-clipboard-fill",
              "fr-btn--tertiary-no-outline",
              "fr-btn--icon-left",
              "fr-ml-md-2w",
              "fr-mt-2w",
              "fr-mt-md-0",
            )}
          >
            {copyButtonLabel}
          </Button>
        </div>
      </div>

      <SectionConventionNextSteps />
    </div>
  );
};
