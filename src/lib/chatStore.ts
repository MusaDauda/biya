// Where the conversation lives between screens.
//
// The assistant used to hold its transcript in component state, so leaving the
// Chat tab destroyed it. Two things follow from that being wrong:
//
//   1. The transcript is written here, on every change, and read back on mount.
//      Switching tabs, reopening the app, and a full reload all survive.
//   2. The model's memory is the `history` this file hands back. The server
//      keeps `agent_sessions` for the audit log but stores no messages, so a
//      session id alone buys nothing: the turns have to travel with the ask.
//
// Storage is per user and per device. It is localStorage, not the database,
// which means a conversation does not follow someone to a second phone. That
// is a deliberate limit, not an oversight: message text is the one thing in
// this app nobody has agreed to have stored server side.

import type { AgentTurn, Proposal } from "./api";

export type Bubble =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "proposal"; proposal: Proposal; state: "pending" | "dismissed" }
  | { kind: "error"; text: string };

export type Conversation = {
  id: string;
  /** The agent session these turns belong to. Absent until the first reply. */
  sessionId?: string;
  bubbles: Bubble[];
  startedAt: number;
  updatedAt: number;
};

export type ChatState = {
  current: Conversation;
  /** Newest first. Capped, because this is a phone and nobody scrolls to 40. */
  earlier: Conversation[];
};

const KEY_PREFIX = "biya_chat_v1_";
const MAX_EARLIER = 20;
/** What the model is told about. Ten turns is the server's own cap. */
const HISTORY_TURNS = 10;

const key = (userId: string) => KEY_PREFIX + userId;

function newId(): string {
  return crypto.randomUUID?.() ?? String(Date.now());
}

export function newConversation(): Conversation {
  const now = Date.now();
  return { id: newId(), bubbles: [], startedAt: now, updatedAt: now };
}

function empty(): ChatState {
  return { current: newConversation(), earlier: [] };
}

/**
 * Reads this user's chat back. Every failure path returns a usable empty state:
 * a corrupt or unreadable store must cost someone their history, never their
 * ability to open the tab.
 */
export function loadChat(userId: string): ChatState {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as ChatState;
    if (!parsed?.current || !Array.isArray(parsed.current.bubbles)) return empty();
    return {
      current: parsed.current,
      earlier: Array.isArray(parsed.earlier) ? parsed.earlier : [],
    };
  } catch {
    return empty();
  }
}

export function saveChat(userId: string, state: ChatState): void {
  try {
    localStorage.setItem(key(userId), JSON.stringify({
      current: state.current,
      earlier: state.earlier.slice(0, MAX_EARLIER),
    }));
  } catch {
    // Private mode, or the quota is full. A conversation that cannot be saved
    // still has to be usable in this session, so this is not surfaced.
  }
}

export function clearChat(userId: string): void {
  try { localStorage.removeItem(key(userId)); } catch { /* see saveChat */ }
}

/** True once there is something worth keeping. An empty screen is not history. */
export function hasContent(c: Conversation): boolean {
  return c.bubbles.some((b) => b.kind === "user");
}

/** Files the open conversation under Earlier and hands back a blank one. */
export function startNew(state: ChatState): ChatState {
  if (!hasContent(state.current)) return { ...state, current: newConversation() };
  return {
    current: newConversation(),
    earlier: [state.current, ...state.earlier].slice(0, MAX_EARLIER),
  };
}

/** Reopens an earlier conversation, filing the open one in its place. */
export function reopen(state: ChatState, id: string): ChatState {
  const target = state.earlier.find((c) => c.id === id);
  if (!target) return state;
  const rest = state.earlier.filter((c) => c.id !== id);
  return {
    current: target,
    earlier: hasContent(state.current) ? [state.current, ...rest].slice(0, MAX_EARLIER) : rest,
  };
}

/** The first thing the person asked, which is what they will recognise it by. */
export function titleOf(c: Conversation): string {
  const first = c.bubbles.find((b) => b.kind === "user");
  const text = first && "text" in first ? first.text.trim() : "";
  if (!text) return "New chat";
  return text.length > 54 ? text.slice(0, 53).trimEnd() + "…" : text;
}

/**
 * The turns the model is given. Proposals and errors are left out: a proposal
 * is an artefact of a turn already in here, and an error is our failure, not
 * something the user said.
 */
export function historyFor(c: Conversation): AgentTurn[] {
  return c.bubbles
    .filter((b): b is Extract<Bubble, { kind: "user" | "assistant" }> =>
      b.kind === "user" || b.kind === "assistant")
    .slice(-HISTORY_TURNS)
    .map((b) => ({ role: b.kind, content: b.text }));
}
