import React, { useState } from "react";
import "./search.css";
import distanceSearchIcon from "src/assets/distance-search-icon.svg";
import locationSearchIcon from "src/assets/location-search-icon.svg";
import phoneSearchIcon from "src/assets/phone-search-icon.svg";

type EnterpriseSearchResultProps = {
  title: string;
  metierDescription: string;
  radius: string;
  employeeCount: string;
  address: string;
  phone: string;
  siret: string;
  key: string;
};

export const EnterpriseSearchResult = ({
  title,
  metierDescription,
  radius,
  employeeCount,
  address,
  phone,
  siret,
  key,
}: EnterpriseSearchResultProps) => {
  const [isExpanded, setExpanded] = useState(false);

  return (
    <div key={key} className="searchResult">
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
        onClick={() => {
          setExpanded(!isExpanded);
        }}
      >
        {isExpanded ? "Masquer les coordonnées" : "Afficher les coordonnées"}
      </button>
      {isExpanded && (
        <>
          <div className="detailContainer">
            <img
              src={locationSearchIcon}
              className="iconFilter"
              alt="adresse"
            />
            {address}
          </div>
          <div className="detailContainer">
            <img src={phoneSearchIcon} alt="numero de téléphone" />
            {phone}
          </div>
          <div className="detailContainer">
            <img
              src={distanceSearchIcon}
              className="iconFilter"
              alt="numero siret"
            />
            {siret}
          </div>
        </>
      )}
    </div>
  );
};
