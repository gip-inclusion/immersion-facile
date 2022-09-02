import React, { cloneElement, Children, useEffect } from "react";

import ReactDOM from "react-dom";
import classNames from "classnames";
import { useFocusTrap } from "./hooks/useFocusTrap";
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
  const [modalRef] = useFocusTrap();
  // const [openedModal, setOpenedModal] = useState(isOpen);
  const colSizes = { sm: 4, lg: 8, md: 6 };
  const colSize = size ? colSizes[size] : null;
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

  useEffect(
    () => () => {
      document.body.style.overflow = "";
    },
    [],
  );

  const handleAnimatedUnmount = () => {
    // handleModal(false);
    setTimeout(() => {
      if (focusBackTo) (focusBackTo as HTMLElement).focus();
      hide();
    }, MODAL_ANIMATION_TIME);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!canClose) {
      return;
    }

    if (
      !modalRef.current ||
      modalRef.current === e.target ||
      (e.target as HTMLButtonElement).className.indexOf("closing-overlay") > -1
    ) {
      handleAnimatedUnmount();
    }
  };
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleAllKeyDown);
      return () => document.removeEventListener("keydown", handleAllKeyDown);
    }
  }, [isOpen]);

  const handleAllKeyDown = (e: KeyboardEvent | React.KeyboardEvent) => {
    if (e.key === "Escape") {
      hide();
      e.preventDefault();
    }
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
    <dialog
      aria-labelledby="fr-modal-title-modal"
      className={_className}
      ref={modalRef}
      //onKeyDown={(e) => handleAllKeyDown(e)}
      onClick={(e) => handleOverlayClick(e)}>
      <div className="fr-container fr-container--fluid fr-container-md fr-col-md-6">
        <div className="fr-grid-row fr-grid-row--center closing-overlay">
          <div className={`fr-col-12 fr-col-md-${colSize}`}>
            <div className="fr-modal__body">
              <div className="fr-modal__header">{closeComponent}</div>
              <div className="fr-modal__content">
                {title}
                {content}
              </div>
              {footer}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
  return ReactDOM.createPortal(component, document.body);
};
