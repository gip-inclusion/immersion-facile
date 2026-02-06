import { fr } from "@codegouvfr/react-dsfr";
import Card from "@codegouvfr/react-dsfr/Card";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { formatDistance } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { equals } from "ramda";

import { memo, type ReactNode } from "react";
import {
  type DateTimeIsoString,
  domElementIds,
  frenchEstablishmentKinds,
  isInternalOfferDto,
  isPhysicalWorkMode,
  type OfferDto,
  remoteWorkModeLabels,
} from "shared";
import type { Link } from "type-route";
import "./SearchResult.scss";

export type EnterpriseSearchResultProps = {
  searchResult: OfferDto;
  linkProps: Link;
  illustration?: ReactNode;
  disableButton?: boolean;
  preview?: boolean;
  showDistance?: boolean;
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
  linkProps,
  searchResult,
  illustration,
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
  } = searchResult;
  const isCustomizedNameValidToDisplay =
    customizedName &&
    customizedName.length > 0 &&
    !frenchEstablishmentKinds.includes(customizedName.toUpperCase().trim());

  const isNotAvailableOffer =
    isInternalOfferDto(searchResult) && !searchResult.isAvailable;

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

  const displayedLocation =
    isInternalOfferDto(searchResult) &&
    !isPhysicalWorkMode(searchResult.remoteWorkMode)
      ? "France entière"
      : `${address.city} (${address.departmentCode})`;
  const linkPropsHandlingNotAvailable:
    | Link
    | {
        disabled: true;
        title: string;
      } = isNotAvailableOffer
    ? {
        disabled: true,
        title:
          "Cette entreprise a reçu le nombre de candidatures qu’elle peut traiter pour le moment. Elle redeviendra disponible pour les candidatures prochainement.",
      }
    : linkProps;

  return (
    <Card
      nativeDivProps={{
        "aria-disabled": true,
      }}
      title={jobTitle}
      desc={establishmentName}
      linkProps={{
        ...linkPropsHandlingNotAvailable,
        id: voluntaryToImmersion
          ? `${domElementIds.search.searchResultButton}-${siret}`
          : `${domElementIds.search.lbbSearchResultButton}-${siret}`,
      }}
      enlargeLink
      titleAs="h2"
      imageComponent={illustration}
      endDetail={dateJobCreatedAt}
      detail={
        isInternalOfferDto(searchResult) && !searchResult.isAvailable ? (
          <span className={fr.cx("fr-icon-close-circle-line")}>
            {" "}
            Mise en relation temporairement indisponible
          </span>
        ) : (
          <span className={fr.cx("fr-icon-checkbox-circle-line")}>
            {" "}
            Mise en relation disponibles
          </span>
        )
      }
      start={
        <Tag className={fr.cx("fr-mb-2w")} iconId="fr-icon-map-pin-2-line">
          {displayedLocation} -{" "}
          {isInternalOfferDto(searchResult) &&
            remoteWorkModeLabels[searchResult.remoteWorkMode].label}
        </Tag>
      }
    />
  );
};

export const SearchResult = memo(
  SearchResultComponent,
  (prevResult, nextResult) => equals(prevResult, nextResult),
);
