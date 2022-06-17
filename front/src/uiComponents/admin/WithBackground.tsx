import React from "react";

export const WithBackground = ({
  children,
}: {
  children: React.ReactElement;
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "30px",
      backgroundColor: "#E5E5F4",
      padding: "10px",
    }}
  >
    {" "}
    {children}
  </div>
);
