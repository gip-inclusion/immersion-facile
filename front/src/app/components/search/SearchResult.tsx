import { fr } from "@codegouvfr/react-dsfr";
import Card from "@codegouvfr/react-dsfr/Card";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { formatDistance } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { equals } from "ramda";
import React, { memo } from "react";
import {
  DateTimeIsoString,
  SearchResultDto,
  domElementIds,
  frenchEstablishmentKinds,
} from "shared";
import { routes } from "src/app/routes/routes";
import "./SearchResult.scss";

export type EnterpriseSearchResultProps = {
  establishment: SearchResultDto;
  onButtonClick?: () => void;
  illustration: React.ReactNode;
  disableButton?: boolean;
  preview?: boolean;
  showDistance?: boolean;
  layout?: "fr-col-lg-4" | "fr-col-md-6";
};

const getLastDate = (
  createdAt?: DateTimeIsoString,
  updatedAt?: DateTimeIsoString,
): DateTimeIsoString | undefined => {
  if (createdAt)
    return formatDistance(new Date(updatedAt ?? createdAt), new Date(), {
      addSuffix: true,
      locale: frLocale,
    });
  return;
};

const SearchResultComponent = ({
  onButtonClick,
  establishment,
  illustration,
  preview,
  layout = "fr-col-lg-4",
}: EnterpriseSearchResultProps) => {
  const {
    siret,
    name,
    customizedName,
    address,
    romeLabel,
    appellations,
    voluntaryToImmersion,
    createdAt,
    updatedAt,
    locationId,
  } = establishment;

  const isCustomizedNameValidToDisplay =
    customizedName &&
    customizedName.length > 0 &&
    !frenchEstablishmentKinds.includes(customizedName.toUpperCase().trim());

  const establishmentRawName = isCustomizedNameValidToDisplay
    ? customizedName
    : name;

  const [establismentNameFirstLetter, ...establismentNameOtherLetters] =
    establishmentRawName;

  const jobTitle =
    appellations.length > 0 ? appellations[0].appellationLabel : romeLabel;

  const establishmentName = [
    establismentNameFirstLetter.toLocaleUpperCase(),
    establismentNameOtherLetters.join("").toLocaleLowerCase(),
  ].join("");

  const dateJobCreatedAt = getLastDate(createdAt, updatedAt);

  return (
    <div className={fr.cx("fr-col-12", "fr-col-md-6", layout)}>
      <Card
        title={jobTitle}
        desc={establishmentName}
        linkProps={{
          ...routes.searchResult({
            appellationCode:
              preview && appellations.length === 0
                ? ""
                : appellations[0].appellationCode,
            siret,
            ...(locationId ? { location: locationId } : {}),
          }).link,
          onClick: preview
            ? () => {}
            : (event) => {
                event.preventDefault();
                if (onButtonClick) {
                  onButtonClick();
                }
              },
        }}
        id={
          voluntaryToImmersion
            ? `${domElementIds.search.searchResultButton}-${siret}`
            : `${domElementIds.search.lbbSearchResultButton}-${siret}`
        }
        enlargeLink
        titleAs="h2"
        imageComponent={illustration}
        endDetail={dateJobCreatedAt}
        start={
          <Tag className={fr.cx("fr-mb-2w")} iconId="fr-icon-map-pin-2-line">
            {address.city} ({address.departmentCode})
          </Tag>
        }
      />
    </div>
  );
};

export const SearchResult = memo(
  SearchResultComponent,
  (prevResult, nextResult) => equals(prevResult, nextResult),
);
