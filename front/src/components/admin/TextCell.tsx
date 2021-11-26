import React, { ReactNode } from "react";

interface TextCellProps {
  title: string;
  contents: ReactNode;
}

export const TextCell = ({ title, contents }: TextCellProps) => (
  <div className="static-info-container" style={{ margin: "0.5rem 0" }}>
    <div style={{ fontWeight: "bold" }}>{title}</div>
    <div style={{ wordWrap: "normal", textAlign: "end" }}>{contents}</div>
  </div>
);
