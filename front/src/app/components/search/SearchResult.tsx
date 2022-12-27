import React from "react";
import {
  addressDtoToString,
  ContactMethod,
  SearchImmersionResultDto,
} from "shared";
import { ButtonsGroup } from "src/../../libs/react-design-system";
import { getMapsLink } from "./ContactEstablishmentModal";

export type EnterpriseSearchResultProps = {
  searchResult: SearchImmersionResultDto;
  onButtonClick: () => void;
  disableButton?: boolean;
};

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
    // additionalInformation,
  } = searchResult;
  const distanceKm = ((distance_m ?? 0) / 1000).toFixed(1);
  return (
    <div className="fr-col-12 fr-col-md-4">
      <div className="im-search-result fr-card">
        <div className="fr-card__body">
          <div className="fr-card__content">
            <h3 className="fr-card__title">{customizedName ?? name}</h3>
            <p className="fr-card__desc">
              {" "}
              {appellationLabels.length > 0
                ? appellationLabels.join(", ")
                : romeLabel}
            </p>
            <p className="fr-card__desc">Plus d'informations :</p>
            <ul className="fr-card__desc fr-text--xs">
              {nafLabel && (
                <li>
                  <strong>{nafLabel}</strong>
                </li>
              )}
              {numberOfEmployeeRange && (
                <li>
                  {numberOfEmployeeRange}{" "}
                  {numberOfEmployeeRange === "0" ? "salarié" : "salariés"}
                </li>
              )}
              <li>
                <a href={getMapsLink(searchResult)} target="_blank">
                  {addressDtoToString(address).toLocaleLowerCase()}
                </a>{" "}
                (
                <strong>
                  {distanceKm}
                  km
                </strong>{" "}
                de votre position)
              </li>
            </ul>
            <ul className="fr-card__desc fr-badges-group">
              <li>
                <InfoLabel
                  className=""
                  contactMode={contactMode}
                  voluntaryToImmersion={voluntaryToImmersion}
                />
              </li>
            </ul>
          </div>
          <div className="fr-card__footer">
            <ButtonsGroup className="fr-btns-group fr-btns-group--sm">
              <button className="fr-btn fr-btn--sm" onClick={onButtonClick}>
                {contactMode === "PHONE" ||
                contactMode === "EMAIL" ||
                contactMode === "IN_PERSON"
                  ? "Contacter l'entreprise"
                  : "Tentez votre chance"}
              </button>
              {website ? (
                <a
                  className="fr-btn fr-btn--sm fr-btn--secondary"
                  href={website}
                  target="_blank"
                >
                  Voir le site web
                </a>
              ) : (
                <></>
              )}
            </ButtonsGroup>
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
  const className = `fr-badge ${
    voluntaryToImmersion ? "fr-badge--blue-cumulus" : ""
  } ${luckyGuess ? "fr-badge--purple-glycine" : ""}`;
  const label = voluntaryToImmersion
    ? "Entreprise accueillante"
    : "Tentez votre chance";
  return voluntaryToImmersion || luckyGuess ? (
    <div className={className}>{label}</div>
  ) : null;
};
