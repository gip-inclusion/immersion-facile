import classNames from "classnames";
import React, { Children, cloneElement, useEffect } from "react";

import ReactDOM from "react-dom";
import Modal from "react-modal";
import "./Modal.css";
import { ModalClose } from "./ModalClose";

/**
 *
 * @visibleName Modale -- Modal
 */
export interface HideCallback {
  (): void;
}

export type ModalDialogProperties = {
  hide: HideCallback;
  isOpen: boolean;
  children?: React.ReactNode | React.ReactNode[];
  id?: string;
  size?: "sm" | "md" | "lg";
  className?: string | object | [];
  canClose?: boolean;
};

const MODAL_ANIMATION_TIME = 300;

// @TODO: should use react-modal (or any package to handle functionality / accessibility)
export const ModalDialog = ({
  children,
  hide,
  size,
  className,
  isOpen,
  canClose,
}: ModalDialogProperties) => {
  // const [openedModal, setOpenedModal] = useState(isOpen);
  const colSizes = { sm: 4, lg: 8, md: 6 };
  const _colSize = size ? colSizes[size] : null;
  const _className = classNames(
    "fr-modal",

    {
      "fr-modal--opened": isOpen,
    },
    className,
  );
  const focusBackTo = document.activeElement;
  const title = Children.toArray(children).filter(
    (child) =>
      React.isValidElement(child) && child.props.__TYPE === "ModalTitle",
  );
  const content = Children.toArray(children).filter(
    (child) =>
      React.isValidElement(child) && child.props.__TYPE === "ModalContent",
  );
  const footer = Children.toArray(children).filter(
    (child) =>
      React.isValidElement(child) && child.props.__TYPE === "ModalFooter",
  );
  const close = Children.toArray(children).filter(
    (child) =>
      React.isValidElement(child) && child.props.__TYPE === "ModalClose",
  );
  useEffect(() => {
    Modal.setAppElement("body");
  }, []);
  const handleAnimatedUnmount = () => {
    // handleModal(false);
    setTimeout(() => {
      if (focusBackTo) (focusBackTo as HTMLElement).focus();
      hide();
    }, MODAL_ANIMATION_TIME);
  };

  let closeComponent;
  if (close.length > 0) {
    closeComponent = cloneElement(close[0] as React.ReactElement, {
      hide: handleAnimatedUnmount,
    });
  } else {
    closeComponent = canClose ? (
      <ModalClose hide={handleAnimatedUnmount} />
    ) : null;
  }

  const component = (
    <Modal
      aria-labelledby="fr-modal-title-modal"
      className={_className}
      overlayClassName={"fr-container-md"}
      isOpen={isOpen}
      onRequestClose={hide}
      shouldCloseOnOverlayClick={true}
    >
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-modal__body fr-col-md-6">
          <div className="fr-modal__header">{closeComponent}</div>
          <div className="fr-modal__content">
            {title}
            {content}
          </div>
          {footer}
        </div>
      </div>
    </Modal>
  );
  return ReactDOM.createPortal(component, document.body);
};
