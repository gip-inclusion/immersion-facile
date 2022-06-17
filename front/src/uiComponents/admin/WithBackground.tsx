import React from "react";

export const WithBackground = ({
  children,
  className,
}: {
  children: React.ReactElement;
  className?: string;
}) => (
  <div
    className={className}
    style={{
      backgroundColor: "#E5E5F4",
      padding: "10px",
    }}
  >
    {" "}
    {children}
  </div>
);
