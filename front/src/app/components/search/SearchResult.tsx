import React from "react"; //ReactNode
import {
  addressDtoToString,
  ContactMethod,
  //ContactMethod,
  SearchImmersionResultDto,
} from "shared";
import { ButtonsGroup } from "src/../../libs/react-design-system";
import { getMapsLink } from "./ContactEstablishmentModal";
// import "./SearchResult.scss";
// import { Icon } from "react-design-system";

type EnterpriseSearchResultProps = {
  searchResult: SearchImmersionResultDto;
  onButtonClick: () => void;
  disableButton?: boolean;
};

// type SearchResultInfoProps = {
//   icon: ReactNode;
//   children: ReactNode;
// };

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

            {/* <ul className="fr-btns-group fr-btns-group--inline-reverse fr-btns-group--inline-lg">
              <li>
                <button className="fr-btn fr-btn--secondary">Label</button>
              </li>
              <li>
                <button className="fr-btn">Label</button>
              </li>
            </ul> */}
          </div>
        </div>
      </div>
      {/* <div className="im-search-result fr-card fr-card--grey fr-enlarge-link">
        <div className="flex flex-wrap justify-between">
          <div className="pb-2">
            <h3>{customizedName ?? name}</h3>

            <div>
              {appellationLabels.length > 0
                ? appellationLabels.join(", ")
                : romeLabel}
            </div>
          </div>

          <InfoLabel
            className=""
            contactMode={contactMode}
            voluntaryToImmersion={voluntaryToImmersion}
          />
        </div>
        <SearchResultInfo
          icon={
            <Icon kind="signal-tower-fill" className="im-search-result__icon" />
          }
        >
          <div className="flex justify-between w-full">
            <div>{distanceKm + " km"}</div>
            {numberOfEmployeeRange && (
              <div>
                {numberOfEmployeeRange}{" "}
                {numberOfEmployeeRange === "0" ? "salarié" : "salariés"}
              </div>
            )}
          </div>
        </SearchResultInfo>
        <SearchResultInfo icon={<LocationOnIcon sx={{ color: iconColor }} />}>
          {addressDtoToString(address).toLocaleLowerCase()}
        </SearchResultInfo>
        {website && (
          <SearchResultInfo icon={<LaunchIcon sx={{ color: iconColor }} />}>
            <a href={website}>{website}</a>
          </SearchResultInfo>
        )}
        {additionalInformation && (
          <SearchResultInfo icon={<CommentIcon sx={{ color: iconColor }} />}>
            {additionalInformation}
          </SearchResultInfo>
        )}
        <hr className="pb-2" />
        <ButtonSearch
          className={"fr-btn--green-archipel"}
          onClick={onButtonClick}
          disabled={disableButton}
          id={"im-search__search-result-action"}
        >
          {contactMode === "PHONE" ||
          contactMode === "EMAIL" ||
          contactMode === "IN_PERSON"
            ? "Contacter l'entreprise"
            : "Tentez votre chance"}
        </ButtonSearch>
      </div> */}
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
