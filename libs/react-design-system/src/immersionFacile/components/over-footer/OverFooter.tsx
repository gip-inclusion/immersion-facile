import React from "react";
import { OverFooterCol, OverFooterColProps } from "./OverFooterCol";
import "./OverFooter.css";
export type OverFooterCols = OverFooterColProps[];
export type OverFooterProps = {
  cols: OverFooterCols;
};

export const OverFooter = ({ cols = [] }: OverFooterProps) => (
  <aside id="over-footer" className="over-footer fr-pt-8w fr-pb-4w">
    <div className="fr-container">
      <div className="fr-grid-row fr-grid-row--gutters">
        {cols.length > -1 &&
          cols.map((col, index) => (
            <OverFooterCol key={`col-${index}`} {...col} />
          ))}
      </div>
    </div>
  </aside>
);
