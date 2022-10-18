import React from "react";

export type OverFooterColProps = {
  title: string;
  subtitle: string;
  link: {
    label: string;
    url: string;
  };
  total: number;
  currentCol: number;
};

export const OverFooterCol = ({
  title,
  subtitle,
  link,
}: OverFooterColProps) => (
  <div className="fr-col-12 fr-col-md">
    <h5 className="fr-h6">
      <span aria-hidden="true" className="fr-mr-2v fr-icon-account-fill"></span>
      {title}
    </h5>
    <div>
      <div className="fr-editor">
        <div className="fr-grid-row">
          <div className="fr-col">
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="fr-grid-row fr-mb-3w">
          <div className="fr-col">
            <a
              href={link.url}
              className="fr-link   fr-icon-arrow-right-line fr-link--icon-right "
            >
              {link.label}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
);
