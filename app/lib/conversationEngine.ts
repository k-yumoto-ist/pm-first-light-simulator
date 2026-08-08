import { conversationTopics, type ConversationTopic } from "../data/conversations";
import type { CharacterId, GameState } from "../types/game";

export interface ConversationEngine {
  getTopics(character: CharacterId, state: GameState): ConversationTopic[];
  getReply(topic: ConversationTopic, state: GameState): string;
}

export class ScenarioConversationEngine implements ConversationEngine {
  getTopics(character: CharacterId, state: GameState) {
    return conversationTopics.filter(topic =>
      topic.character === character &&
      (!topic.minTurn || state.turn >= topic.minTurn)
    );
  }

  getReply(topic: ConversationTopic, state: GameState) {
    return typeof topic.reply === "function" ? topic.reply(state) : topic.reply;
  }
}

export const conversationEngine = new ScenarioConversationEngine();
