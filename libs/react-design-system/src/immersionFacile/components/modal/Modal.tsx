import React, {
  cloneElement,
  Children,
  useRef,
  useEffect,
  useState,
} from "react";

import ReactDOM from "react-dom";
import classNames from "classnames";
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

const useFocusTrap = (ref: React.MutableRefObject<null>) => {
  const [focus, setFocus] = useState(0);
  const [focusableElements, setFocusableElements] = useState<
    HTMLElement[] | null
  >(null);

  const getKeyboardFocusableElements = (element: HTMLElement) => {
    const filtered: HTMLElement[] = [];
    const arrayElements = Array.from(
      element.querySelectorAll(
        'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
      ),
      (e) => e,
    );

    arrayElements.forEach((el: Element) => {
      if (el && !el.hasAttribute("disabled")) {
        filtered.push(el as HTMLElement);
      }
    });
    return filtered;
  };

  const handleTabulation = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (e.key === "Tab" && !e.shiftKey && focusableElements) {
      setFocus((currentFocus) => (currentFocus + 1) % focusableElements.length);
    }
    if (e.key === "Tab" && e.shiftKey) {
      setFocus((currentFocus) =>
        currentFocus - 1 < 0 && focusableElements
          ? focusableElements.length - 1
          : currentFocus - 1,
      );
    }
  };

  useEffect(() => {
    if (!focusableElements) {
      const elements = ref.current && getKeyboardFocusableElements(ref.current);
      setFocusableElements(elements);
    } else {
      focusableElements[focus].focus();
    }
  }, [focus, focusableElements, ref]);

  return handleTabulation;
};

export const ModalDialog = ({
  children,
  hide,
  size,
  className,
  isOpen,
  canClose,
}: ModalDialogProperties) => {
  const modalRef = useRef(null);
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
  const handleTabulation = useFocusTrap(modalRef);
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

  // const handleModal = (open: boolean) => {
  //   if (modalRef.current) {
  //     setOpenedModal(open);
  //     document.body.style.overflow = open ? "hidden" : "";
  //   }
  // };

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

  // useEffect(() => {
  //   handleModal(true);
  // }, []);

  const handleAllKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      hide();
      e.preventDefault();
    }
    if (e.key === "Tab") {
      handleTabulation(e);
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
    // eslint-disable-next-line
    <dialog
      aria-labelledby="fr-modal-title-modal"
      className={_className}
      ref={modalRef}
      onKeyDown={(e) => handleAllKeyDown(e)}
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
