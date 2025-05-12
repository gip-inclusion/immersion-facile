import { subDays } from "date-fns";
import { sort } from "ramda";
import { match } from "ts-pattern";
import type {
  DiscussionReadDto,
  DiscussionVisualStatus,
} from "./discussion.dto";

export const getDiscussionVisualStatus = ({
  discussion,
  now,
}: { discussion: DiscussionReadDto; now: Date }): DiscussionVisualStatus => {
  return match(discussion.status)
    .with("REJECTED", (): DiscussionVisualStatus => "rejected")
    .with("ACCEPTED", (): DiscussionVisualStatus => "accepted")
    .with("PENDING", (): DiscussionVisualStatus => {
      const orderedExchanges = sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
        discussion.exchanges,
      );
      const latestExchange = orderedExchanges[orderedExchanges.length - 1];

      if (latestExchange.sender === "establishment") return "answered";

      if (new Date(latestExchange.sentAt) <= subDays(now, 15))
        return "needs-urgent-answer";

      if (orderedExchanges.length === 1) return "new";

      return "needs-answer";
    })
    .exhaustive();
};
