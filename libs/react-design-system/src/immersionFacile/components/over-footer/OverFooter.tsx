import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

import { OverFooterCol, OverFooterColProps } from "./OverFooterCol";

import "./OverFooter.css";
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
    >
      <div className={fr.cx("fr-container")}>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          {cols.length > -1 &&
            cols.map((col, index) => (
              <OverFooterCol key={`col-${index}`} {...col} />
            ))}
        </div>
      </div>
    </aside>
  );
};
