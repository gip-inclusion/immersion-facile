import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
import React, { useLayoutEffect, useRef, useState } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./ButtonWithSubMenu.styles";

export const ButtonWithSubMenu = ({
  navItems,
  buttonLabel,
}: {
  navItems: MainNavigationProps.Item.Link[];
  buttonLabel: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { cx } = useStyles();
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
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
        ref={toggleButtonRef}
        className={cx(fr.cx("fr-m-md-0"))}
        iconId="fr-icon-account-line"
        iconPosition="left"
        onClick={() => setIsOpen((isOpen) => !isOpen)}
        priority="tertiary"
      >
        {buttonLabel}
      </Button>
      {isOpen && (
        <div
          className={cx(
            fr.cx("fr-menu", "fr-collapse", "fr-collapse--expanded"),
            Styles.menu,
          )}
        >
          <ul className={cx(fr.cx("fr-menu__list"), Styles.list)}>
            {navItems.map((item) => (
              <li key={item.linkProps.id}>
                <a className={fr.cx("fr-nav__link")} href={item.linkProps.href}>
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
