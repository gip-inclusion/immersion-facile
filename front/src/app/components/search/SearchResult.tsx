import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import React, { useState } from "react";
import {
  addressDtoToString,
  ContactMethod,
  SearchImmersionResultDto,
} from "shared";
import { getMapsLink } from "./ContactEstablishmentModal";
import LinesEllipsis from "react-lines-ellipsis";
import "./SearchResult.scss";

export type EnterpriseSearchResultProps = {
  searchResult: SearchImmersionResultDto;
  onButtonClick: () => void;
  disableButton?: boolean;
};

const componentName = "im-search-result";

export const SearchResult = ({
  onButtonClick,
  searchResult,
}: EnterpriseSearchResultProps) => {
  const {
    name,
    customizedName,
    distance_m,
    address,
    contactMode,
    numberOfEmployeeRange,
    nafLabel,
    romeLabel,
    appellationLabels,
    voluntaryToImmersion,
    website,
    fitForDisabledWorkers,
    additionalInformation,
  } = searchResult;
  const distanceKm = ((distance_m ?? 0) / 1000).toFixed(1);
  const establishmentRawName =
    customizedName && customizedName.length > 0 ? customizedName : name;
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
    <div className="fr-col-12 fr-col-md-4">
      <div className={`${componentName} fr-card`}>
        <div className="fr-card__body">
          <div className="fr-card__content">
            <h3 className="fr-card__title">{establismentName}</h3>
            <p className="fr-card__desc">
              {" "}
              {appellationLabels.length > 0
                ? appellationLabels.join(", ")
                : romeLabel}
            </p>
            <ul className="fr-card__desc fr-text--xs">
              {nafLabel && <li>{nafLabel}</li>}
              {numberOfEmployeeRange && (
                <li>
                  {numberOfEmployeeRange}{" "}
                  {numberOfEmployeeRange === "0" ? "salarié" : "salariés"}
                </li>
              )}
              <li>
                <a
                  href={getMapsLink(searchResult)}
                  target="_blank"
                  className={`${componentName}__location-link`}
                >
                  {addressDtoToString(address).toLocaleLowerCase()}
                </a>{" "}
                (
                <strong>
                  {distanceKm}
                  km
                </strong>{" "}
                de votre position)
              </li>
              {website && (
                <li>
                  <a href={website} target="_blank">
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
            <ul className="fr-card__desc fr-badges-group">
              <li>
                <InfoLabel
                  className=""
                  contactMode={contactMode}
                  voluntaryToImmersion={voluntaryToImmersion}
                />
              </li>
              {fitForDisabledWorkers && (
                <li>
                  <Label className={fr.cx("fr-badge--yellow-moutarde")}>
                    Priorité aux personnes en situation de handicap
                  </Label>
                </li>
              )}
            </ul>
          </div>
          <div className="fr-card__footer">
            <Button
              size="small"
              type="button"
              iconId="fr-icon-mail-fill"
              onClick={onButtonClick}
            >
              {contactMode === "PHONE" ||
              contactMode === "EMAIL" ||
              contactMode === "IN_PERSON"
                ? "Contacter l'entreprise"
                : "Tentez votre chance"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

type InfoLabelProps = {
  voluntaryToImmersion?: boolean;
  contactMode?: ContactMethod;
  className?: string;
};

const InfoLabel = ({ contactMode, voluntaryToImmersion }: InfoLabelProps) => {
  const luckyGuess = typeof contactMode === "undefined";
  const className = [
    ...(voluntaryToImmersion ? ["fr-badge--blue-cumulus"] : []),
    ...(luckyGuess ? ["fr-badge--purple-glycine"] : []),
  ].join(" ");

  const label = voluntaryToImmersion
    ? "Entreprise accueillante"
    : "Tentez votre chance";

  return voluntaryToImmersion || luckyGuess ? (
    <Label className={className}>{label}</Label>
  ) : null;
};

const Label = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => <span className={`fr-badge ${className}`}>{children}</span>;
