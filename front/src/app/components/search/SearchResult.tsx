import React, { memo, useState } from "react";
import LinesEllipsis from "react-lines-ellipsis";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { equals } from "ramda";
import { useStyles } from "tss-react/dsfr";
import {
  addressDtoToString,
  frenchEstablishmentKinds,
  getMapsLink,
  SearchImmersionResultDto,
  toAbsoluteUrl,
} from "shared";
import { ImmersionOfferLabels } from "./ImmersionOfferLabels";
import "./SearchResult.scss";

export type EnterpriseSearchResultProps = {
  establishment: SearchImmersionResultDto;
  onButtonClick?: () => void;
  disableButton?: boolean;
  preview?: boolean;
  showDistance?: boolean;
  layout?: "fr-col-lg-4" | "fr-col-md-6";
};

const componentName = "im-search-result";

const SearchResultComponent = ({
  onButtonClick,
  establishment,
  preview,
  layout = "fr-col-lg-4",
  showDistance = true,
}: EnterpriseSearchResultProps) => {
  const { cx } = useStyles();

  const {
    siret,
    name,
    customizedName,
    distance_m,
    address,
    contactMode,
    numberOfEmployeeRange,
    nafLabel,
    romeLabel,
    appellations,
    voluntaryToImmersion,
    website,
    fitForDisabledWorkers,
    additionalInformation,
    urlOfPartner,
  } = establishment;

  const distanceKm = ((distance_m ?? 0) * 0.001).toFixed(1);
  const isCustomizedNameValidToDisplay =
    customizedName &&
    customizedName.length > 0 &&
    !frenchEstablishmentKinds.includes(customizedName.toUpperCase().trim());
  const establishmentRawName = isCustomizedNameValidToDisplay
    ? customizedName
    : name;

  const [establismentNameFirstLetter, ...establismentNameOtherLetters] =
    establishmentRawName;

  const [additionalInformationClamped, setAdditionalInformationClamped] =
    useState<boolean>(true);

  const [additionalInformationIsTooLong, setAdditionalInformationIsTooLong] =
    useState<boolean>(false);

  const [
    shouldUpdateAdditionalInformationState,
    setShouldUpdateAdditionalInformationState,
  ] = useState<boolean>(true);

  const establismentName = [
    establismentNameFirstLetter.toLocaleUpperCase(),
    establismentNameOtherLetters.join("").toLocaleLowerCase(),
  ].join("");

  const onAdditionalInformationClick = () => {
    setAdditionalInformationClamped((prevValue) => !prevValue);
  };

  const onAdditionalInformationReflow = (additionalInformationDisplayState: {
    clamped: boolean;
    text: string;
  }) => {
    if (shouldUpdateAdditionalInformationState) {
      setAdditionalInformationIsTooLong(
        additionalInformationDisplayState.clamped,
      );
      setShouldUpdateAdditionalInformationState(false);
    }
  };

  return (
    <div className={fr.cx("fr-col-12", "fr-col-md-6", layout)}>
      <div
        className={cx(fr.cx("fr-card"), componentName)}
        data-establishment-siret={siret}
      >
        <div className={fr.cx("fr-card__body")}>
          <div className={fr.cx("fr-card__content")}>
            <h3
              className={cx(
                fr.cx("fr-card__title"),
                `${componentName}-card__title`,
              )}
            >
              {establismentName}
            </h3>
            <p className={fr.cx("fr-card__desc")}>
              {" "}
              {appellations.length > 0
                ? appellations
                    .map((appellation) => appellation.appellationLabel)
                    .join(", ")
                : romeLabel}
            </p>
            <ul className={fr.cx("fr-card__desc", "fr-text--xs")}>
              {nafLabel && nafLabel !== "" && <li>{nafLabel}</li>}
              {numberOfEmployeeRange && (
                <li>
                  {numberOfEmployeeRange}{" "}
                  {numberOfEmployeeRange === "0" ? "salarié" : "salariés"}
                </li>
              )}
              <li>
                <a
                  href={getMapsLink(establishment)}
                  target="_blank"
                  className={cx(`${componentName}__location-link`)}
                  rel="noreferrer"
                >
                  {addressDtoToString(address).toLocaleLowerCase()}
                </a>{" "}
                {showDistance && (
                  <span>
                    <strong>
                      {distanceKm}
                      km
                    </strong>{" "}
                    de votre position
                  </span>
                )}
              </li>
              {urlOfPartner && (
                <li>
                  <a
                    href={toAbsoluteUrl(urlOfPartner)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {/* eslint-disable-next-line no-irregular-whitespace */}
                    Trouver le contact sur La Bonne Boite
                  </a>
                </li>
              )}
              {website && (
                <li>
                  <a
                    href={toAbsoluteUrl(website)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Voir le site de l'entreprise
                  </a>
                </li>
              )}
              {additionalInformation && (
                <li>
                  <LinesEllipsis
                    text={additionalInformation}
                    maxLine={additionalInformationClamped ? 2 : 10}
                    basedOn="letters"
                    ellipsis={"..."}
                    onReflow={onAdditionalInformationReflow}
                  />
                  {additionalInformationIsTooLong && (
                    <button
                      className={fr.cx("fr-tag", "fr-tag--sm", "fr-mt-1w")}
                      onClick={onAdditionalInformationClick}
                    >
                      {additionalInformationClamped
                        ? "Voir plus"
                        : "Voir moins"}
                    </button>
                  )}
                </li>
              )}
            </ul>
            <ImmersionOfferLabels
              voluntaryToImmersion={voluntaryToImmersion}
              contactMode={contactMode}
              fitForDisabledWorkers={fitForDisabledWorkers}
            />
          </div>
          <div className={fr.cx("fr-card__footer")}>
            <Button
              size="small"
              type="button"
              iconId="fr-icon-mail-fill"
              disabled={preview}
              onClick={
                preview
                  ? () => {
                      //
                    }
                  : onButtonClick
              }
            >
              {voluntaryToImmersion || contactMode !== undefined || preview
                ? "Contacter l'entreprise"
                : "Tentez votre chance"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SearchResult = memo(
  SearchResultComponent,
  (prevResult, nextResult) => equals(prevResult, nextResult),
);
