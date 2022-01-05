import React from "react";
import distanceSearchIcon from "src/assets/distance-search-icon.svg";
import "./search.css";
import { ContactMethod } from "src/shared/FormEstablishmentDto";

type EnterpriseSearchResultProps = {
  title: string;
  radius: string;
  address: string;
  siret: string;
  contactMode?: ContactMethod;
  onButtonClick: () => void;
  disableButton?: boolean;
};

export const EnterpriseSearchResult = ({
  title,
  radius,
  address,
  siret,
  contactMode,
  onButtonClick,
  disableButton,
}: EnterpriseSearchResultProps) => {
  return (
    <div className="searchResult">
      <h2 className="searchResultTitle">{title}</h2>
      <span className="text-xs">siret: {siret}</span>
      <p>{address.toLocaleLowerCase()}</p>
      <div className="searchResultDistanceCompanySizeContainer">
        <p className="distanceIconLabelContainer">
          <img src={distanceSearchIcon} alt="" />
          {radius}
        </p>
      </div>
      <div className="searchDetailsSeparator" />
      <button
        className="expandResultDetailsButton"
        onClick={onButtonClick}
        disabled={disableButton}
      >
        {contactMode === "PHONE" ||
        contactMode === "EMAIL" ||
        contactMode === "IN_PERSON"
          ? "Contacter l'entreprise"
          : "Tentez votre chance"}
      </button>
    </div>
  );
};
