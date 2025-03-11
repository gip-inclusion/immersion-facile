import { fr } from "@codegouvfr/react-dsfr";
import type { ReactNode, RefObject } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./FormOverlay.styles";

export const FormOverlay = ({
  children,
  parentRef,
  isVisible,
}: {
  children: ReactNode;
  parentRef?: RefObject<HTMLFormElement>;
  isVisible: boolean;
}) => {
  const { cx } = useStyles();
  if (
    parentRef?.current &&
    !parentRef.current?.classList.contains(Styles.parent)
  )
    parentRef.current.classList.add(Styles.parent);
  return isVisible ? (
    <div className={cx(fr.cx("fr-p-4w"), Styles.root)}>{children}</div>
  ) : null;
};
