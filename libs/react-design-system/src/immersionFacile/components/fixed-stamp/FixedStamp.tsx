import React from "react";
import { Link } from "type-route";
import { useStyles } from "tss-react/dsfr";

import "./FixedStamp.css";

type FixedStampProps = {
  image: JSX.Element;
  overtitle?: JSX.Element | string;
  title?: JSX.Element | string;
  subtitle?: JSX.Element | string;
  link?: Link;
};

export const FixedStamp = ({
  image,
  title,
  subtitle,
  overtitle,
  link,
}: FixedStampProps) => {
  const { cx } = useStyles();
  return (
    <aside className={cx("fixed-stamp")}>
      {image && <div className={cx("fixed-stamp__image-wrapper")}>{image}</div>}
      <div className={cx("fixed-stamp__content")}>
        {overtitle && (
          <span className={cx("fixed-stamp__overtitle")}>{overtitle}</span>
        )}
        {title && <span className={cx("fixed-stamp__title")}>{title}</span>}
        {subtitle && (
          <span className={cx("fixed-stamp__subtitle")}>{subtitle}</span>
        )}
      </div>
      {link && <a className={cx("fixed-stamp__overlay-link")} {...link} />}
    </aside>
  );
};
