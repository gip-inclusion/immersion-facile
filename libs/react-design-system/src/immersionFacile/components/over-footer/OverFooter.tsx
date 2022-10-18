import React from "react";
import { OverFooterCol, OverFooterColProps } from "./OverFooterCol";
import "./OverFooter.css";

type OverFooterProps = {
  cols: OverFooterColProps[];
};

export const OverFooter = ({ cols = [] }: OverFooterProps) => (
  <section className="over-footer fr-py-4w">
    <div className="fr-container">
      <div className="fr-grid-row fr-grid-row--gutters">
        {cols.length > -1 &&
          cols.map((col, index) => (
            <OverFooterCol
              key={`col-${index}`}
              {...col}
              total={cols.length}
              currentCol={index}
            />
          ))}
      </div>
    </div>
  </section>
);
