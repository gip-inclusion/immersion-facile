import { MatchRangeDto } from "shared";

export type SliceOfString = {
  startIndexInclusive: number;
  endIndexExclusive: number;
  bolded: boolean;
};

export const hightlightStringsFromMatches = (
  matchRanges: MatchRangeDto[],
  description: string,
) =>
  matchRanges.reduce(
    (acc, { startIndexInclusive, endIndexExclusive }, index) => {
      const isFirstMatch = acc.length === 0;
      const unboldedRange = {
        startIndexInclusive: isFirstMatch
          ? 0
          : acc[acc.length - 1].endIndexExclusive,
        endIndexExclusive: startIndexInclusive,
        bolded: false,
      };

      const boldedRange = {
        startIndexInclusive,
        endIndexExclusive,
        bolded: true,
      };

      const isLastMatch = index === matchRanges.length - 1;
      const addEndOfDescriptionIfLastMatch = isLastMatch
        ? [
            {
              startIndexInclusive: endIndexExclusive,
              endIndexExclusive: description.length,
              bolded: false,
            },
          ]
        : [];

      return [
        ...acc,
        unboldedRange,
        boldedRange,
        ...addEndOfDescriptionIfLastMatch,
      ];
    },
    [] as SliceOfString[],
  );
