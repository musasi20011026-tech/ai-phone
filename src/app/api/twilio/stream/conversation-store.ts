/**
 * 会話履歴ストア - route間で共有
 * 本番環境ではRedis等の外部ストアに置き換える
 *
 * TTL付き: 30分で自動クリーンアップ（異常終了時のメモリリーク防止）
 */

import type { ConversationMessage } from '@/lib/llm/client';

interface ConversationEntry {
  messages: ConversationMessage[];
  createdAt: number;
}

const store = new Map<string, ConversationEntry>();
const TTL_MS = 30 * 60 * 1000; // 30分

// 定期クリーンアップ（5分ごと）
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * 互換性のあるラッパー（既存コードのMap APIをそのまま使えるように）
 */
export const conversationStore = {
  has(callSid: string): boolean {
    return store.has(callSid);
  },

  get(callSid: string): ConversationMessage[] | undefined {
    const entry = store.get(callSid);
    return entry?.messages;
  },

  set(callSid: string, messages: ConversationMessage[]): void {
    store.set(callSid, { messages, createdAt: Date.now() });
  },

  delete(callSid: string): boolean {
    return store.delete(callSid);
  },
};
