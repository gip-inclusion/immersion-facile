import { fr } from "@codegouvfr/react-dsfr";
import type { FooterProps as FooterPropsDsfr } from "@codegouvfr/react-dsfr/Footer";
import type { MouseEventHandler, ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import FooterStyles from "./Footer.styles";

export type NavLink = {
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  label: ReactNode;
  href?: string;
  active?: boolean;
  target?: string;
  children?: NavLink[];
  index?: number;
  id: string;
  "aria-controls"?: string;
  "data-fr-js-modal-button"?: string;
};

export type NavTopGroupLinks = {
  title: string;
  links: NavLink[];
};

export type FooterProps = {
  links?: NavLink[];
  navTopGroupLinks?: NavTopGroupLinks[];
  bottomLinks?: (NavLink | FooterPropsDsfr.BottomItem.Button)[];
  partnersLogos?: ReactNode;
  plateformeInclusionLogo?: ReactNode;
};

const TopLink = ({ link }: { link: NavLink }) => {
  const { cx } = useStyles();
  return (
    <li className={cx("fr-footer__content-item")}>
      <a
        className={fr.cx(
          "fr-footer__content-link",
          "fr-icon-external-link-line",
          "fr-link--icon-right",
        )}
        {...link}
      >
        {link.label}
      </a>
    </li>
  );
};

const BottomLink = ({
  link,
}: { link: NavLink | FooterPropsDsfr.BottomItem }) => {
  const { cx } = useStyles();
  return (
    <li className={fr.cx("fr-footer__bottom-item")}>
      {"label" in link ? (
        <a className={fr.cx("fr-footer__bottom-link")} {...link}>
          {link.label}
        </a>
      ) : (
        <button
          type="button"
          className={cx(
            fr.cx(
              "fr-footer__bottom-link",
              "fr-icon-theme-fill",
              "fr-link--icon-left",
              link.iconId,
            ),
            link.buttonProps?.className,
          )}
          {...link.buttonProps}
        >
          {link.text}
        </button>
      )}
    </li>
  );
};

export const Footer = ({
  links,
  navTopGroupLinks,
  bottomLinks,
  partnersLogos,
  plateformeInclusionLogo,
}: FooterProps) => {
  const { cx } = useStyles();
  return (
    <footer className={cx(fr.cx("fr-footer"))} id="main-footer">
      <div className={fr.cx("fr-footer__top")}>
        <div className={fr.cx("fr-container")}>
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            {navTopGroupLinks?.map((groupOfLink) => (
              <div
                className={fr.cx("fr-col-12", "fr-col-sm-3", "fr-col-md-2")}
                key={groupOfLink.title}
              >
                <span className={fr.cx("fr-footer__top-cat")}>
                  {groupOfLink.title}
                </span>
                {groupOfLink.links && groupOfLink.links.length > 0 && (
                  <ul className={fr.cx("fr-footer__top-list")}>
                    {groupOfLink.links.map((link) => (
                      <li key={link.id}>
                        <a
                          className={fr.cx("fr-footer__top-link")}
                          href={link.href}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={fr.cx("fr-container")}>
        <div className={cx(fr.cx("fr-footer__body"), FooterStyles.body)}>
          <div
            className={cx(fr.cx("fr-footer__content"), FooterStyles.content)}
          >
            {links && links.length > 0 && (
              <ul className={fr.cx("fr-footer__content-list")}>
                {links.map((link) => (
                  <TopLink key={link.id} link={link} />
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className={fr.cx("fr-footer__partners", "fr-pt-4w", "fr-pb-2w")}>
          <div className={fr.cx("fr-footer__partners-logos")}>
            <div
              className={cx(
                fr.cx("fr-footer__partners-main"),
                FooterStyles.partnersMain,
              )}
            >
              <span className={cx(FooterStyles.brandText)}>
                Ce service fait partie de la{" "}
              </span>
              <div
                className={cx(fr.cx("fr-footer__brand"), FooterStyles.brand)}
              >
                {plateformeInclusionLogo}
                <p className={cx(fr.cx("fr-mb-0"), FooterStyles.brandText)}>
                  Découvrez les outils qui portent l'inclusion au cœur de leur
                  service. À chaque service, son objectif.
                  <a
                    className={fr.cx(
                      "fr-footer__content-link",
                      "fr-icon-external-link-line",
                      "fr-link--icon-right",
                    )}
                    href={"https://inclusion.beta.gouv.fr/"}
                  >
                    Découvrez nos services
                  </a>
                </p>
              </div>
            </div>
            <div
              className={cx(
                fr.cx("fr-footer__partners-sub"),
                FooterStyles.partnersSub,
              )}
            >
              {partnersLogos}
            </div>
          </div>
        </div>
        <div className={fr.cx("fr-footer__bottom")}>
          {bottomLinks && bottomLinks.length > 0 && (
            <ul className={fr.cx("fr-footer__bottom-list")}>
              {bottomLinks.map((link, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Index is ok here
                <BottomLink key={index} link={link} />
              ))}
            </ul>
          )}

          <div className={fr.cx("fr-footer__bottom-copy")}>
            <p>
              Sauf mention contraire, tous les contenus de ce site sont sous{" "}
              <a
                href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
                target="_blank"
                rel="noreferrer"
              >
                licence etalab-2.0
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
