import React, { Children, ReactNode } from "react";

type FormSectionTitleProps = {
  children: ReactNode;
};

export const FormSectionTitle = ({ children }: FormSectionTitleProps) => {
  const content = Children.toArray(children).filter(
    (child) => typeof child === "string",
  );
  const actions = Children.toArray(children).filter(
    (child) => typeof child != "string" && React.isValidElement(child),
  );
  return (
    <>
      <div className="h-6" />
      <div
        className={
          "sticky top-0 text-immersionBlue-dark font-semibold p-2 mb-1 bg-white border-b text-lg z-10 flex justify-between"
        }
      >
        <div>{content}</div>
        {actions && <div>{actions}</div>}
      </div>
    </>
  );
};
