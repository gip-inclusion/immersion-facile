import PropTypes from "prop-types";
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

ModalTitle.defaultProps = {
  __TYPE: "ModalTitle",
  className: "",
};

ModalTitle.propTypes = {
  // react-dsfr components must have the __TYPE property with value setted by a callback
  __TYPE: () => {
    "ModalTitle";
  },
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  className: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.array,
  ]),
};

export default ModalTitle;
