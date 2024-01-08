import { MatchRangeDto } from "shared";

export type SliceOfString = {
  startIndexInclusive: number;
  endIndexExclusive: number;
  bolded: boolean;
};

export const highlightStringsFromMatches = (
  matchRanges: MatchRangeDto[],
  description: string,
): SliceOfString[] => {
  const matchRangesWithoutOverlaps = mergeOverlappingMatchRanges(
    matchRanges,
    description.length,
  );

  const result = matchRangesWithoutOverlaps.reduce(
    (acc, matchRange, currentIndex) => {
      const prevEndIndex =
        currentIndex === 0
          ? 0
          : matchRangesWithoutOverlaps[currentIndex - 1].endIndexExclusive;
      const sliceOfStrings: SliceOfString[] = [
        ...acc,
        ...(matchRange.startIndexInclusive !== prevEndIndex
          ? [
              {
                bolded: false,
                startIndexInclusive: prevEndIndex,
                endIndexExclusive: matchRange.startIndexInclusive,
              },
            ]
          : []),
        {
          bolded: true,
          ...matchRange,
        },
      ];
      return sliceOfStrings;
    },
    [] as SliceOfString[],
  );

  const lastResult = result[result.length - 1] ?? [];

  return [
    ...result,
    ...(lastResult && lastResult.endIndexExclusive !== description.length
      ? [
          {
            bolded: false,
            startIndexInclusive: lastResult.endIndexExclusive ?? 0,
            endIndexExclusive: description.length,
          },
        ]
      : []),
  ];
};

const mergeOverlappingMatchRanges = (
  matchRanges: MatchRangeDto[],
  lengthOfDescription: number,
): MatchRangeDto[] => {
  const result: MatchRangeDto[] = [];
  for (let i = 0; i < lengthOfDescription; i++) {
    const isBold = matchRanges.some(
      (matchRange) =>
        matchRange.startIndexInclusive <= i && i < matchRange.endIndexExclusive,
    );

    if (isBold) {
      const lastMatchRange = result[result.length - 1];
      if (lastMatchRange && lastMatchRange.endIndexExclusive === i) {
        lastMatchRange.endIndexExclusive++;
      } else {
        result.push({ startIndexInclusive: i, endIndexExclusive: i + 1 });
      }
    }
  }

  return result;
};
