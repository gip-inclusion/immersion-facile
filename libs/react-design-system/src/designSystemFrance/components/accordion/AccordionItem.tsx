import classNames from "classnames";
import React, {
  ElementType,
  FC,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ComponentProps } from "./Accordion";

type Case = {
  class: string;
  stateHeight: string | number | undefined;
};
type Cases = {
  true: Case;
  false: Case;
};
type AccordionItemProps = {
  title: string | React.ReactNode;
  titleAs?: ElementType;
  expandedItems?: React.ReactNode[];
  onClick?: (
    trullyExpanded: boolean,
    event: React.MouseEvent,
    id: number,
  ) => void;
  children?: React.ReactNode;
  className?: string | object | [];
  id?: number | string;
  initExpand?: boolean;
  size?: "sm" | "md" | "lg";
  color?: string;
};

export default function useCollapse(
  id: string,
  isExpanded: boolean | undefined,
  className?: string,
) {
  const expandedItem: Cases = {
    false: {
      class: classNames(className, "fr-collapse"),
      stateHeight: "",
    },
    true: {
      class: classNames(className, "fr-collapse fr-collapse--expanded"),
      stateHeight: "none",
    },
  };
  const [collapse, setCollapse] = useState("0px");
  const key = String(isExpanded) as "true" | "false"; // 🫠
  const item = expandedItem[key];

  useEffect(() => {
    const element = id
      ? document.getElementById(id)
      : document.querySelector(`.${className}`);
    if (element) {
      setCollapse(`-${element.getBoundingClientRect().height}px`);
    }
  }, [id, className]);
  return { item, collapse };
}

export const AccordionDSFRItem = forwardRef(
  (props: AccordionItemProps, ref: React.ForwardedRef<HTMLLIElement>) => {
    const {
      title,
      titleAs: Tag = "h3",
      expandedItems,
      onClick,
      children,
      className,
      id,
      initExpand,
      size,
      color,
    } = props;
    const TitleTag: ElementType = Tag;
    const TitleComponent: FC<ComponentProps> = ({ children }) => (
      <TitleTag>{children}</TitleTag>
    );
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [initItem, setInitItem] = useState(initExpand);
    const checkExpanded = useCallback(() => {
      const idsExpanded =
        expandedItems && !!expandedItems.find((it) => it === id);
      return initItem ? true : idsExpanded;
    }, [initItem, expandedItems, id]);
    const [isExpanded, setIsExpanded] = useState(checkExpanded);
    const { item, collapse } = useCollapse(`fr-accordion-${id}`, isExpanded);

    const onItemClick = (e: React.MouseEvent) => {
      let target = e.target as HTMLElement;
      if (target && target.nodeName !== "BUTTON") {
        target = target.parentNode as HTMLElement;
      }
      const trullyExpanded = buttonRef.current?.ariaExpanded === "true";
      if (onClick) {
        onClick(trullyExpanded, e, parseFloat(target.id.slice(6)));
      }
      setInitItem(false);
    };

    useEffect(() => {
      setIsExpanded(checkExpanded());
    }, [isExpanded, setIsExpanded, checkExpanded]);

    useEffect(() => {
      if (color && buttonRef.current) {
        buttonRef.current.style.color = `${color}`;
      }
    }, [color]);

    const _btnClassName = classNames("fr-accordion__btn", {
      [`fr-btn--${size}`]: size && size !== "md",
    });
    const styles = {
      maxHeight: item.stateHeight,
      "--collapse": collapse,
    } as React.CSSProperties;
    return (
      <li className={classNames(className)} ref={ref}>
        <section className="fr-accordion">
          <TitleComponent className="fr-accordion__title">
            <button
              ref={buttonRef}
              className={_btnClassName}
              id={`button${id}`}
              onClick={(e) => onItemClick(e)}
              type="button"
              aria-controls={`fr-accordion-${id}`}
              aria-expanded={isExpanded}
            >
              {title}
            </button>
          </TitleComponent>
          <div style={styles} className={item.class} id={`fr-accordion-${id}`}>
            {children}
          </div>
        </section>
      </li>
    );
  },
);

AccordionDSFRItem.defaultProps = {
  titleAs: "h3",
  className: "",
  initExpand: false,
  expandedItems: [],
  size: "md",
  id: 0,
  color: "",
};
