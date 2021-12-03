declare module "@dataesr/react-dsfr" {
  import * as React from "react";

  export type ModalChildren = React.ReactNode[] | React.ReactNode;
  export type ModalSize = "sm" | "md" | "lg";
  export type ModalClassName = string | Object | any[];
  export interface ModalProps {
    id?: string;
    isOpen?: boolean;
    children: ModalChildren;
    hide: (...args: any[]) => any;
    size?: ModalSize;
    className?: ModalClassName;
    canClose?: boolean;
  }
  const Modal: React.FC<ModalProps>;

  export type ModalTitleChildren = string | React.ReactNode;
  export type ModalTitleClassName = string | Object | any[];
  export interface ModalTitleProps {
    __TYPE?: any;
    children: ModalTitleChildren;
    icon?: string;
    className?: ModalTitleClassName;
  }
  const ModalTitle: React.FC<ModalTitleProps>;

  export type ModalContentChildren =
    | React.ReactNode[]
    | React.ReactNode
    | string;
  export type ModalContentClassName = string | Object | any[];
  export interface ModalContentProps {
    __TYPE?: any;
    children: ModalContentChildren;
    className?: ModalContentClassName;
  }
  const ModalContent: React.FC<ModalContentProps>;

  export type ModalFooterChildren =
    | React.ReactNode[]
    | React.ReactNode
    | string;
  export type ModalFooterClassName = string | Object | any[];
  export interface ModalFooterProps {
    __TYPE?: any;
    children: ModalFooterChildren;
    className?: ModalFooterClassName;
  }
  const ModalFooter: React.FC<ModalFooterProps>;

  export type ModalCloseChildren = string | React.ReactNode;
  export type ModalCloseClassName = string | Object | any[];
  export interface ModalCloseProps {
    __TYPE?: any;
    children?: ModalCloseChildren;
    title?: string;
    /**
     * @ignore
     */
    hide?: (...args: any[]) => any;
    className?: ModalCloseClassName;
  }
  const ModalClose: React.FC<ModalCloseProps>;
}
