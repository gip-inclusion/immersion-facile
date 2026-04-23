import { fr } from "@codegouvfr/react-dsfr";
import type { ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import type { Capitalize } from "../../utils";
import Styles from "./ExchangeMessage.styles";

type ExchangeRole = "establishment" | "potentialBeneficiary";
type ForViewer = `for${Capitalize<ExchangeRole>}`;

const forViewer = (viewer: ExchangeRole): ForViewer => {
  const capitalizedViewer = viewer[0].toUpperCase() + viewer.slice(1);
  return `for${capitalizedViewer}` as ForViewer;
};

export const ExchangeMessage = ({
  sender,
  viewer,
  children,
}: {
  sender: ExchangeRole;
  viewer: ExchangeRole;
  children: ReactNode;
}) => {
  const { cx } = useStyles();
  return (
    <section
      className={cx(
        fr.cx("fr-mt-4w", "fr-p-4w"),
        Styles.root,
        Styles[sender],
        Styles[forViewer(viewer)],
      )}
    >
      {children}
    </section>
  );
};
