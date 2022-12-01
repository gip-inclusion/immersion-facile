import React from "react";

const ModalTitle = ({
  children,
  className,
}: {
  children: string;
  className: string;
}) => (
  <h1 className={className} id="fr-modal-title-modal">
    {children}
  </h1>
);

export default ModalTitle;
