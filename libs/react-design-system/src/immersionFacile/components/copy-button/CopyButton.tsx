import { fr } from "@codegouvfr/react-dsfr";
import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import { useCopyButton } from "./useCopyButton";

export type CopyButtonProperties = ButtonProps.Common &
  ButtonProps.AsButton & {
    textToCopy: string;
    label: string;
    withIcon?: boolean;
    iconOnly?: boolean;
  };

export const CopyButton = (props: CopyButtonProperties) => {
  const { cx } = useStyles();
  const { onCopyButtonClick, copyButtonIsDisabled, copyButtonLabel } =
    useCopyButton(props.label);

  return (
    <Button
      id={props.id}
      type="button"
      disabled={copyButtonIsDisabled}
      onClick={() => onCopyButtonClick(props.textToCopy)}
      size="small"
      priority={props.priority ?? "tertiary no outline"}
      className={cx(
        fr.cx(
          "fr-py-0",
          !props.iconOnly && "fr-px-2v",
          props.withIcon && "fr-icon-clipboard-fill",
          props.withIcon && !props.iconOnly && "fr-btn--icon-left",
        ),
        props.className,
      )}
      title={props.iconOnly ? copyButtonLabel : undefined}
      children={props.iconOnly ? undefined : copyButtonLabel}
    />
  );
};
