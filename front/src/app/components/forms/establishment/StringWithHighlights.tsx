import React, { Fragment } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import {
  highlightStringsFromMatches,
  SliceOfString,
} from "src/app/components/forms/establishment/highlightStringsFromMatches";
import { Proposal } from "./Proposal";

export const StringWithHighlights = ({
  description,
  matchRanges,
}: Pick<Proposal<unknown>, "description" | "matchRanges">) => {
  const slices: SliceOfString[] =
    matchRanges.length === 0
      ? onNoMatchRanges(description)
      : highlightStringsFromMatches(matchRanges, description);

  return (
    <span>
      {slices.map(
        ({ startIndexInclusive, endIndexExclusive, bolded }, index) => {
          const text = description.slice(
            startIndexInclusive,
            endIndexExclusive,
          );
          if (bolded)
            return (
              // eslint-disable-next-line react/no-array-index-key
              <span className={fr.cx("fr-text--bold")} key={index}>
                {text}
              </span>
            );
          // eslint-disable-next-line react/no-array-index-key
          return <Fragment key={index}>{text}</Fragment>;
        },
      )}
    </span>
  );
};

const onNoMatchRanges = (description: string) => [
  {
    startIndexInclusive: 0,
    endIndexExclusive: description.length,
    bolded: false,
  },
];
