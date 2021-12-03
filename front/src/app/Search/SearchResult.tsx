import React, { useState } from "react";
import { ContactEstablishmentModal } from "src/app/Search/ContactEstablishmentModal";
import distanceSearchIcon from "src/assets/distance-search-icon.svg";
import "./search.css";

type EnterpriseSearchResultProps = {
  title: string;
  metierDescription: string;
  radius: string;
  employeeCount: string;
  address: string;
  phone: string;
  siret: string;
  onButtonClick: () => void;
  disableButton?: boolean;
};

export const EnterpriseSearchResult = ({
  title,
  metierDescription,
  radius,
  employeeCount,
  address,
  phone,
  siret,
  onButtonClick,
  disableButton,
}: EnterpriseSearchResultProps) => {
  return (
    <div className="searchResult">
      <h2 className="searchResultTitle">{title}</h2>
      <p className="metierDescription">{metierDescription}</p>
      <div className="searchResultDistanceCompanySizeContainer">
        <p className="distanceIconLabelContainer">
          <img src={distanceSearchIcon} alt="" />
          {radius}
        </p>
        <p>{employeeCount}</p>
      </div>
      <div className="searchDetailsSeparator" />
      <button
        className="expandResultDetailsButton"
        onClick={onButtonClick}
        disabled={disableButton}
      >
        Contacter l'entreprise
      </button>
    </div>
  );
};
