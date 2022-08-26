import React from "react";

export const WithBackground = ({
  children,
}: {
  children: React.ReactElement;
  className?: string;
}) => (
  <div
    className="p-5"
    style={{
      backgroundColor: "#E5E5F4",
    }}>
    {" "}
    {children}
  </div>
);
