import classNames, { ArgumentArray } from "classnames";
import React, {
  Children,
  cloneElement,
  ElementType,
  FC,
  HTMLAttributes,
  ReactElement,
  useState,
} from "react";

export type AccordionProperties = {
  className?: ArgumentArray;
  children: React.ReactNode;
  as: ElementType;
  size: "sm" | "md" | "lg";
  keepOpen: boolean;
  color: string;
};

type Action = "open" | "close" | "closeOthers";

type ActionObject = {
  open?: (oldArray: []) => never[] | React.SetStateAction<never[]>;
  close: never[];
  closeOthers: () => never[] | React.SetStateAction<never[]>;
};

export interface ComponentProps extends HTMLAttributes<HTMLOrSVGElement> {
  as?: ElementType;
}

/**
 *
 * @visibleName Accordion
 */
export const AccordionDSFR = ({
  className,
  children,
  as: Tag = "div",
  keepOpen,
  size,
  color,
}: AccordionProperties) => {
  const HtmlTag: ElementType = Tag;
  const HtmlComponent: FC<ComponentProps> = ({ children, ...rest }) => (
    <HtmlTag {...rest}>{children}</HtmlTag>
  );
  const [expandedItems, setExpandedItems] = useState([]);

  const expand = (isExpanded: boolean, _: React.MouseEvent, newItem: never) => {
    let action: Action = "open";
    const actionObject: ActionObject = {
      open: (oldArray: []) => [...oldArray, newItem],
      close: expandedItems.filter((item) => item !== newItem),
      closeOthers: () => [...[], newItem],
    };
    if (expandedItems.indexOf(newItem) > -1 || isExpanded) {
      action = "close";
    } else if (!keepOpen) {
      action = "closeOthers";
    }
    setExpandedItems(actionObject[action] as React.SetStateAction<never[]>);
  };
  const childs = Children.toArray(children).map((child, i) => {
    // TODO fix custom id by AccordionItem
    const id = i + 1;
    return cloneElement(child as ReactElement, {
      id,
      key: id,
      size,
      color,
      onClick: (isExpanded: boolean, e: React.MouseEvent, newItem: string) => {
        if (React.isValidElement(child) && child.props.onClick) {
          child.props.onClick(isExpanded, e, newItem);
        }
        expand(isExpanded, e, newItem as never);
      },
      keepOpen,
      expandedItems,
    });
  });

  return (
    <HtmlComponent className={classNames(className)}>
      <ul className="fr-accordions-group">{childs}</ul>
    </HtmlComponent>
  );
};

AccordionDSFR.defaultProps = {
  as: "div",
  className: "",
  keepOpen: false,
  size: "md",
  color: "",
};
