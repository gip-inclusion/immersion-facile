import type {
  CrispGateway,
  InitiateCrispConversationParams,
} from "../ports/CrispGateway";

export class InMemoryCrispApi implements CrispGateway {
  #initiatedConversationParams: InitiateCrispConversationParams[] = [];

  async initiateConversation(params: InitiateCrispConversationParams) {
    this.#initiatedConversationParams.push(params);
  }

  get initiatedConversationParams() {
    return this.#initiatedConversationParams;
  }
}
