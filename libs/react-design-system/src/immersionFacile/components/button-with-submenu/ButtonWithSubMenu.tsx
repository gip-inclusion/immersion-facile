import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import type { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
import { type ElementRef, useLayoutEffect, useRef, useState } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./ButtonWithSubMenu.styles";

export const ButtonWithSubMenu = ({
  navItems,
  buttonLabel,
  id,
}: {
  navItems: MainNavigationProps.Item.Link[];
  buttonLabel: string;
  id?: string;
}) => {
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

  const isMobile = id?.includes("-mobile");

  return (
    <div className={cx(Styles.root)}>
      <Button
        ref={toggleButtonRef}
        className={cx(fr.cx("fr-m-md-0"))}
        iconId="fr-icon-account-line"
        iconPosition="left"
        id={buttonId}
        nativeButtonProps={{
          "aria-controls": `${buttonId}-submenu`,
        }}
        onClick={() => {
          setIsOpen((isOpen) => !isOpen);
        }}
        priority="tertiary"
      >
        {buttonLabel}
      </Button>

      <div
        className={cx(
          fr.cx("fr-menu"),
          Styles.menu,
          !isOpen && Styles.menuHidden,
        )}
        id={`${buttonId}-submenu`}
        aria-hidden={!isOpen}
      >
        <ul className={cx(fr.cx("fr-menu__list"), Styles.list)}>
          {navItems.map((item) => (
            <li key={item.linkProps.id}>
              <a
                className={fr.cx("fr-nav__link")}
                {...item.linkProps}
                id={
                  isMobile ? `${item.linkProps.id}-mobile` : item.linkProps.id
                }
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
