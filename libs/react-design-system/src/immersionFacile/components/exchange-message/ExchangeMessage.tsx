import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./ExchangeMessage.styles";

export const ExchangeMessage = ({
  sender,
  children,
}: {
  sender: "establishment" | "potentialBeneficiary";
  children: React.ReactNode;
}) => {
  const { cx } = useStyles();
  return (
    <section
      className={cx(fr.cx("fr-mt-4w", "fr-p-4w"), Styles.root, Styles[sender])}
    >
      {children}
    </section>
  );
};
