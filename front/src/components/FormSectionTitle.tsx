import React from "react";

type FormSectionTitleProps = { children: string };

export const FormSectionTitle = ({ children }: FormSectionTitleProps) => (
  <>
    <div className="h-6" />
    <div
      className={
        "sticky top-0 text-immersionBlue-dark font-semibold p-2 mb-1 bg-white border-b text-lg z-10"
      }
    >
      {children}
    </div>
  </>
);
