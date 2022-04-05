import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

const ModalTitle = ({
  children,
  className,
}: {
  children: string;
  className: string;
}) => {
  return (
    <h1 className={classNames(className)} id="fr-modal-title-modal">
      {children}
    </h1>
  );
};

ModalTitle.defaultProps = {
  __TYPE: "ModalTitle",
  className: "",
};

ModalTitle.propTypes = {
  // react-dsfr components must have the __TYPE property with value setted by a callback
  // eslint-disable-next-line react/no-unused-prop-types
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
