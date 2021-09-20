import React, { Component } from "react";

interface TextCellProps {
  title: string;
  contents: string;
}

export const TextCell = ({ title, contents }: TextCellProps) => {
  return (
    <div className="static-info-container">
      <p style={{ fontWeight: "bold" }}>{title}</p>
      <p>{contents}</p>
    </div>
  );
};
