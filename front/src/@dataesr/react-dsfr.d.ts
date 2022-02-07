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

  export type AccordionAs = "div" | "section";
  export type AccordionSize = "sm" | "md" | "lg";
  export type AccordionChildren = React.ReactNode[] | React.ReactNode;
  export type AccordionClassName = string | Object | any[];
  export interface AccordionProps {
    /**
     * Html tag to render accordion wrapper.
     */
    as?: AccordionAs;
    size?: AccordionSize;
    keepOpen?: boolean;
    color?: string;
    children: AccordionChildren;
    className?: AccordionClassName;
  }
  const Accordion: React.FC<AccordionProps>;

  export type AccordionItemTitleAs = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  export type AccordionItemSize = "sm" | "md" | "lg";
  export type AccordionItemTitle = string | React.ReactElement<any>;
  export type AccordionItemChildren =
    | React.ReactNode[]
    | React.ReactNode
    | string;

  export type AccordionItemClassName = string | Object | any[];
  export interface AccordionItemProps {
    /**
     * Html tag to render in accordion title.
     */
    titleAs?: AccordionItemTitleAs;
    /**
     * @ignore
     */
    initExpand?: boolean;
    onClick?: (...args: any[]) => any;
    /**
     * @ignore
     */
    expandedItems?: number[];
    size?: AccordionItemSize;
    id?: number;
    color?: string;
    title: AccordionItemTitle;
    keepOpen?: boolean;
    children: AccordionItemChildren;
    className?: AccordionItemClassName;
  }

  const AccordionItem: React.FC<AccordionItemProps>;
}
