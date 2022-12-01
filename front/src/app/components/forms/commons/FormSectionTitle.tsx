import React, { ReactNode } from "react";

type FormSectionTitleProps = {
  children: ReactNode[] | ReactNode;
};

export const FormSectionTitle = ({ children }: FormSectionTitleProps) => {
  const [title, ...actions] = Array.isArray(children) ? children : [children];

  return (
    <>
      <div className="h-6" />
      <div
        className={
          "sticky top-0 text-immersionBlue-dark font-semibold py-2 mb-1 bg-white border-b text-lg z-10 flex justify-between"
        }
      >
        <div>{title}</div>
        {actions.length !== 0 && <div>{actions}</div>}
      </div>
    </>
  );
};
