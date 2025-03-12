import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import "./OverFooter.css";
import { OverFooterCol, type OverFooterColProps } from "./OverFooterCol";
export type OverFooterCols = OverFooterColProps[];
export type OverFooterProps = {
  cols: OverFooterCols;
};

export const OverFooter = ({ cols = [] }: OverFooterProps) => {
  const { cx } = useStyles();
  return (
    <aside
      id="over-footer"
      className={cx(fr.cx("fr-pt-8w", "fr-pb-4w"), "over-footer")}
      role="complementary"
      aria-label="Aide et informations complémentaires"
    >
      <div className={fr.cx("fr-container")}>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          {cols.length > -1 &&
            cols.map((col, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Index is ok here
              <OverFooterCol key={`col-${index}`} {...col} />
            ))}
        </div>
      </div>
    </aside>
  );
};
