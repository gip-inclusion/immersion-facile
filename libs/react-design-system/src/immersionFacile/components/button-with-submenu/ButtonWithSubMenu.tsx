import { fr } from "@codegouvfr/react-dsfr";
import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { type ElementRef, useLayoutEffect, useRef, useState } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./ButtonWithSubMenu.styles";

export type ButtonWithSubMenuProps = {
  navItems: (ButtonProps & { id: string })[];
  buttonLabel: string;
  buttonIconId?: ButtonProps["iconId"];
  id?: string;
};

export const ButtonWithSubMenu = ({
  navItems,
  buttonLabel,
  buttonIconId,
  id,
}: ButtonWithSubMenuProps) => {
  const buttonId = id ?? "button-with-submenu";
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { cx } = useStyles();
  const toggleButtonRef = useRef<ElementRef<"button">>(null);
  useLayoutEffect(() => {
    document.body.addEventListener("click", (event) => {
      if (
        window.matchMedia(fr.breakpoints.up("lg").replace("@media ", ""))
          .matches &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target as Node)
      )
        setIsOpen(false);
    });
    window.addEventListener("resize", () => {
      const shouldOpenSubMenu = window.matchMedia(
        fr.breakpoints.down("lg").replace("@media ", ""),
      ).matches;
      setIsOpen(shouldOpenSubMenu);
    });
    return () => {
      document.body.removeEventListener("click", () => {});
      window.removeEventListener("resize", () => {});
    };
  }, []);

  return (
    <div className={cx(Styles.root)}>
      <Button
        {...({
          ref: toggleButtonRef,
          className: cx(fr.cx("fr-m-md-0", "fr-pr-0")),
          id: buttonId,
          nativeButtonProps: {
            "aria-controls": `${buttonId}-submenu`,
            type: "button",
          },
          onClick: () => setIsOpen((isOpen) => !isOpen),
          priority: "tertiary",
          ...(buttonIconId && {
            iconId: buttonIconId,
            iconPosition: "left" as const,
          }),
          children: (
            <>
              {buttonLabel}
              <span
                className={fr.cx("fr-icon-arrow-down-s-line", "fr-mx-2v")}
                aria-hidden="true"
              />
            </>
          ),
        } as ButtonProps)}
      />

      <div
        className={cx(
          fr.cx("fr-menu"),
          Styles.menu,
          !isOpen && Styles.menuHidden,
        )}
        id={`${buttonId}-submenu`}
        aria-hidden={!isOpen}
      >
        <ul className={cx(fr.cx("fr-menu__list", "fr-p-0"), Styles.list)}>
          {navItems.map((item) => {
            return (
              <li
                key={item.id}
                className={cx(fr.cx("fr-p-0"), Styles.listElement)}
              >
                {item.linkProps ? (
                  <a
                    className={fr.cx("fr-nav__link")}
                    {...item.linkProps}
                    id={item.linkProps.id}
                  >
                    {item.children}
                  </a>
                ) : (
                  <button
                    type="button"
                    className={fr.cx("fr-nav__link")}
                    {...item.nativeButtonProps}
                    onClick={item?.onClick ? item?.onClick : undefined}
                  >
                    {item.children}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
