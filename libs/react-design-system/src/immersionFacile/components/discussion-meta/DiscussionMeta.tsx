import { fr } from "@codegouvfr/react-dsfr/fr";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./DiscussionMeta.styles";

export const DiscussionMeta = ({
  children,
}: {
  children: React.ReactNode[];
}) => {
  const { cx } = useStyles();
  return (
    <ul className={cx(fr.cx("fr-mb-2w", "fr-pl-0"), Styles.root)}>
      {children.map((child) => (
        <li className={cx(Styles.item)}>{child}</li>
      ))}
    </ul>
  );
};
