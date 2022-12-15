import React from "react"; //ReactNode
import {
  //ContactMethod,
  SearchImmersionResultDto,
} from "shared";
// import { Icon } from "react-design-system";
import "./EnterpriseSearchResult.scss";

type EnterpriseSearchResultProps = {
  searchResult: SearchImmersionResultDto;
  onButtonClick: () => void;
  disableButton?: boolean;
};

// type SearchResultInfoProps = {
//   icon: ReactNode;
//   children: ReactNode;
// };

export const EnterpriseSearchResult = ({
  onButtonClick,
  searchResult,
}: EnterpriseSearchResultProps) => {
  const {
    name,
    customizedName,
    distance_m,
    // address,
    // contactMode,
    // numberOfEmployeeRange,
    nafLabel,
    // romeLabel,
    // appellationLabels,
    // voluntaryToImmersion,
    // website,
    // additionalInformation,
  } = searchResult;
  const distanceKm = ((distance_m ?? 0) / 1000).toFixed(1);
  return (
    <div className="fr-col-12 fr-col-md-4 fr-mb-2w">
      <div className="fr-card fr-enlarge-link" onClick={onButtonClick}>
        <div className="fr-card__content">
          <div className="fr-card__body">
            <h3 className="fr-card__title">{customizedName ?? name}</h3>

            <p className="fr-card__desc">
              Éclairer les personnes à la recherche d'une formation
              professionnelle dans leur choix
            </p>
            <div className="fr-card__start">
              {nafLabel && (
                <p className="fr-card__detail">
                  <abbr title="Distance">{distanceKm}km</abbr>
                </p>
              )}
              <ul className="fr-badges-group">
                {nafLabel && (
                  <li>
                    <p className="fr-badge">{nafLabel}</p>
                  </li>
                )}

                <li>
                  <p className="fr-badge">label badge</p>
                </li>
              </ul>
            </div>
          </div>
          <div className="fr-card__footer">
            <ul className="fr-btns-group fr-btns-group--inline-reverse fr-btns-group--inline-lg">
              <li>
                <button className="fr-btn fr-btn--secondary">Label</button>
              </li>
              <li>
                <button className="fr-btn">Label</button>
              </li>
            </ul>
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

// type InfoLabelProps = {
//   voluntaryToImmersion?: boolean;
//   contactMode?: ContactMethod;
//   className?: string;
// };

// const InfoLabel = ({
//   contactMode,
//   voluntaryToImmersion,
//   className,
// }: InfoLabelProps) => {
//   const defaultStyles =
//     "text-immersionBlue bg-blue-50 rounded-md p-2 h-10 text-center";
//   const allStyles = `${defaultStyles} ${className}`;

//   if (voluntaryToImmersion) {
//     return (
//       <div className={allStyles}>
//         <SentimentSatisfiedAltIcon /> Entreprise accueillante
//       </div>
//     );
//   }

//   switch (contactMode) {
//     case undefined:
//       return (
//         <div className={allStyles}>
//           <Icon kind="star-s-line" /> Tentez votre chance
//         </div>
//       );

//     default:
//       return null;
//   }
// };
