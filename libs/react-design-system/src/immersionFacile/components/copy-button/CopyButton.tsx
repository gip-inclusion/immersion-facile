import { fr } from "@codegouvfr/react-dsfr";
import React, { useState } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./CopyButton.styles";

export type CopyButtonProperties = {
  textToCopy: string;
  withBorder?: boolean;
  className?: string;
} & ({ label: string; withIcon: boolean } | { withIcon: true });

export const CopyButton = (props: CopyButtonProperties) => {
  const { cx } = useStyles();
  const [isCopied, setIsCopied] = useState(false);

  const onCopyButtonClick = (stringToCopy: string) => {
    navigator.clipboard
      .writeText(stringToCopy)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 3_000);
      })
      // eslint-disable-next-line no-console
      .catch((error) => console.error(error));
  };

  const copyButtonIsDisabled = isCopied;

  const defaultLabel = "label" in props ? props.label : "";
  const copyButtonLabel = isCopied ? "Copié !" : defaultLabel;

  return (
    <button
      disabled={copyButtonIsDisabled}
      onClick={() => onCopyButtonClick(props.textToCopy)}
      className={cx(
        fr.cx(
          "fr-btn",
          "fr-btn--sm",
          "fr-btn--tertiary-no-outline",
          "fr-py-0",
          "fr-px-2v",
          props.withIcon && "fr-icon-clipboard-fill",
          props.withIcon && "fr-btn--icon-left",
        ),
        props.withBorder && Styles.copyButtonBorder,
        props.className,
      )}
      type="button"
    >
      {copyButtonLabel}
    </button>
  );
};
