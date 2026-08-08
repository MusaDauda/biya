import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { biya, font, formatNgn, initials, radius, relativeTime, type } from "./theme";
import { Avatar, BiyaIcon, Card, Eyebrow, Sheet } from "./primitives";
import { ClockIcon, LockIcon } from "./icons";
import {
  askAssistant, assistantStatus, resolveProposal,
  type AgentReply, type Me, type Proposal,
} from "../../../lib/api";
import {
  hasContent, historyFor, loadChat, reopen, saveChat, startNew, titleOf,
  type Bubble, type ChatState,
} from "../../../lib/chatStore";

/**
 * The assistant.
 *
 * The rule that matters here is that A PROPOSAL MUST NOT LOOK LIKE AN ANSWER.
 * An answer is text on the page: no border, no card, nothing to press. A
 * proposal is a solid object with a lock on it, a confirm action, and a line
 * saying no money has moved. A person should be able to tell them apart from
 * across a room, because the whole safety argument rests on them noticing.
 */

const SUGGESTIONS = [
  "What is my balance in naira today?",
  "What did I spend this week?",
  "Why was I charged a fee on that transfer?",
  "Send Hauwa ₦1,200 for lunch",
];

export function Assistant({ user, active, onConfirm }: {
  user: Me;
  /** Whether the Chat tab is the one on screen. This stays mounted when it is
   *  not, so anything that costs a request waits until it is first shown. */
  active: boolean;
  /** Hands the proposal to PayFlow, which quotes it and takes the PIN. */
  onConfirm: (proposal: Proposal) => void;
}) {
  // Read back before the first paint, so returning to the tab shows the
  // conversation rather than showing an empty one and then correcting itself.
  const [chat, setChat] = useState<ChatState>(() => loadChat(user.id));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const asked = useRef(false);

  const bubbles = chat.current.bubbles;

  useEffect(() => {
    if (!active || asked.current) return;
    asked.current = true;
    assistantStatus().then((s) => setOffline(!s.configured)).catch(() => setOffline(true));
  }, [active]);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, busy]);
  useEffect(() => { saveChat(user.id, chat); }, [user.id, chat]);

  const append = (extra: Bubble[], sessionId?: string) => {
    setChat((c) => ({
      ...c,
      current: {
        ...c.current,
        sessionId: sessionId ?? c.current.sessionId,
        bubbles: [...c.current.bubbles, ...extra],
        updatedAt: Date.now(),
      },
    }));
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    // Read before appending: the model is given the turns that came before this
    // one, and the message itself travels separately.
    const conversation = chat.current;
    setInput("");
    append([{ kind: "user", text: message }]);
    setBusy(true);
    try {
      const reply: AgentReply = await askAssistant(
        user.id, message, conversation.sessionId, historyFor(conversation),
      );
      const next: Bubble[] = [];
      if (reply.text) next.push({ kind: "assistant", text: reply.text });
      for (const p of reply.proposals ?? []) next.push({ kind: "proposal", proposal: p, state: "pending" });
      append(next, reply.sessionId);
    } catch (err) {
      append([{ kind: "error", text: err instanceof Error ? err.message : "The assistant is not reachable right now." }]);
    } finally {
      setBusy(false);
    }
  };

  const dismiss = async (proposalId: string) => {
    setChat((c) => ({
      ...c,
      current: {
        ...c.current,
        bubbles: c.current.bubbles.map((x) =>
          x.kind === "proposal" && x.proposal.proposalId === proposalId ? { ...x, state: "dismissed" } : x),
        updatedAt: Date.now(),
      },
    }));
    await resolveProposal(proposalId, "rejected").catch(() => {});
  };

  const empty = bubbles.length === 0;

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: biya.ground }}>
      <header
        className="flex items-center"
        style={{ gap: 10, padding: "0 20px 10px", paddingTop: "calc(20px + var(--safe-top, 0px))" }}
      >
        <BiyaIcon size={28} variant="indigo" />
        <div className="flex-1 min-w-0">
          <div style={{ ...type.row, fontSize: 16, color: biya.ink }}>Biya assistant</div>
        </div>

        {chat.earlier.length > 0 && (
          <button
            onClick={() => setHistoryOpen(true)}
            aria-label="Earlier chats"
            className="flex items-center justify-center transition-opacity active:opacity-60"
            style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: biya.surface, border: `1px solid ${biya.line}` }}
          >
            <ClockIcon size={16} color={biya.muted} />
          </button>
        )}

        {hasContent(chat.current) && (
          <button
            onClick={() => setChat(startNew)}
            className="transition-opacity active:opacity-60"
            style={{
              height: 34, padding: "0 13px", borderRadius: 11, backgroundColor: biya.surface,
              border: `1px solid ${biya.line}`,
              fontFamily: font.sans, fontWeight: 600, fontSize: 13, color: biya.ink,
            }}
          >
            New chat
          </button>
        )}
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto" style={{ padding: "8px 20px 16px" }}>
        {empty && <EmptyState name={user.first_name ?? user.display_name.split(" ")[0]} onPick={send} disabled={offline || busy} />}

        <div className="flex flex-col" style={{ gap: 14 }}>
          {bubbles.map((b, i) => {
            if (b.kind === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div
                    style={{
                      maxWidth: "84%", padding: "10px 14px", borderRadius: 16, borderBottomRightRadius: 6,
                      backgroundColor: biya.action, ...type.body, fontSize: 14, color: "#fff",
                    }}
                  >
                    {b.text}
                  </div>
                </div>
              );
            }

            if (b.kind === "assistant") {
              // An answer is plain text. No container, nothing to press.
              return (
                <div key={i} style={{ ...type.body, fontSize: 14.5, color: biya.ink, maxWidth: "94%", whiteSpace: "pre-wrap" }}>
                  {b.text}
                </div>
              );
            }

            if (b.kind === "error") {
              return (
                <div key={i} style={{ ...type.body, fontSize: 13.5, color: biya.fail }}>
                  {b.text}
                </div>
              );
            }

            return (
              <ProposalCard
                key={i}
                proposal={b.proposal}
                dismissed={b.state === "dismissed"}
                onConfirm={() => onConfirm(b.proposal)}
                onDismiss={() => dismiss(b.proposal.proposalId)}
              />
            );
          })}

          {busy && (
            <motion.span
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.3, repeat: Infinity }}
              style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: biya.faint }}
            >
              Thinking
            </motion.span>
          )}
        </div>
      </div>

      <div
        style={{
          padding: "10px 20px", paddingBottom: 96,
          borderTop: `1px solid ${biya.line}`, backgroundColor: biya.surface,
        }}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center"
          style={{ gap: 8 }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={offline ? "The assistant is not reachable" : "Ask about your money"}
            disabled={offline || busy}
            className="flex-1 min-w-0 outline-none"
            style={{
              height: 46, borderRadius: 13, backgroundColor: biya.ground, padding: "0 14px",
              ...type.body, fontSize: 14.5, color: biya.ink,
            }}
          />
          <button
            type="submit"
            disabled={offline || busy || !input.trim()}
            aria-label="Send"
            className="flex items-center justify-center transition-transform active:scale-95 disabled:opacity-40"
            style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: biya.action }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5m0 0-6 6m6-6 6 6" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>

      {historyOpen && (
        <HistorySheet
          chat={chat}
          onPick={(id) => { setChat((c) => reopen(c, id)); setHistoryOpen(false); }}
          onDismiss={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}

/** Earlier conversations, on this device. Tapping one puts it back on screen. */
function HistorySheet({ chat, onPick, onDismiss }: {
  chat: ChatState;
  onPick: (id: string) => void;
  onDismiss: () => void;
}) {
  return (
    <Sheet onDismiss={onDismiss}>
      <div style={{ padding: "10px 20px 4px" }}>
        <span style={{ ...type.title, fontSize: 19, color: biya.ink }}>Earlier</span>
      </div>

      <div style={{ padding: "14px 20px 0", maxHeight: 380, overflowY: "auto" }}>
        <Card>
          {chat.earlier.map((c, i) => (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className="w-full text-left transition-opacity active:opacity-70"
              style={{
                display: "block", padding: "14px 15px",
                borderBottom: i === chat.earlier.length - 1 ? "none" : `1px solid ${biya.hairline}`,
              }}
            >
              <span className="block truncate" style={{ ...type.rowSm, color: biya.ink }}>{titleOf(c)}</span>
              <span className="block" style={{ ...type.bodySm, color: biya.faint, marginTop: 3 }}>
                {relativeTime(c.updatedAt)}
              </span>
            </button>
          ))}
        </Card>

        <p style={{ ...type.body, color: biya.faint, marginTop: 12 }}>
          Chats are kept on this phone only, so they do not follow you to another device.
        </p>
      </div>
    </Sheet>
  );
}

function EmptyState({ name, onPick, disabled }: { name: string; onPick: (s: string) => void; disabled: boolean }) {
  return (
    <div style={{ paddingBottom: 8 }}>
      <div style={{ ...type.title, fontSize: 26, color: biya.ink, lineHeight: 1.2 }}>
        Hello {name}. What do you need?
      </div>
      <p style={{ ...type.body, color: biya.muted, marginTop: 10 }}>
        It can read your account and explain anything on it. Ask in English, Pidgin or Hausa.
      </p>

      <div className="flex flex-col" style={{ gap: 8, marginTop: 18 }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            disabled={disabled}
            className="text-left transition-transform active:scale-[0.99] disabled:opacity-50"
            style={{
              padding: "13px 15px", borderRadius: 13, backgroundColor: biya.surface,
              border: `1px solid ${biya.line}`, ...type.body, fontSize: 14, color: biya.ink,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <Card style={{ marginTop: 18 }}>
        <div style={{ padding: "14px 15px" }}>
          <Eyebrow>What it can and cannot do</Eyebrow>
          <p style={{ ...type.body, color: biya.muted, marginTop: 8 }}>
            It can open a receipt, start a transfer for you to confirm, and explain a fee.
          </p>
          <p style={{ ...type.body, color: biya.muted, marginTop: 6 }}>
            It never moves money on its own. Every payment ends at your PIN, except a scheduled
            payment you set up yourself and can cancel in one tap.
          </p>
        </div>
      </Card>
    </div>
  );
}

/**
 * The proposal. Bordered, locked, and explicitly not a payment. The confirm
 * action leads to a quote and a PIN, never straight to money moving.
 */
function ProposalCard({
  proposal, dismissed, onConfirm, onDismiss,
}: { proposal: Proposal; dismissed: boolean; onConfirm: () => void; onDismiss: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: dismissed ? 0.55 : 1, y: 0 }}>
      <div
        style={{
          backgroundColor: biya.surface,
          border: `1.5px solid ${dismissed ? biya.line : biya.action}`,
          borderRadius: radius.card,
          overflow: "hidden",
        }}
      >
        <div
          className="flex items-center"
          style={{
            gap: 7, padding: "9px 14px",
            backgroundColor: dismissed ? biya.ground : biya.actionWashSoft,
            borderBottom: `1px solid ${biya.hairline}`,
          }}
        >
          <LockIcon size={14} color={dismissed ? biya.faint : biya.action} />
          <span
            style={{
              fontFamily: font.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: dismissed ? biya.faint : biya.action,
            }}
          >
            {dismissed ? "Dismissed" : "Needs your PIN"}
          </span>
        </div>

        <div style={{ padding: "16px 15px" }}>
          <div className="flex items-center" style={{ gap: 11 }}>
            <Avatar text={initials(proposal.payeeName)} size={38} tone="neutral" />
            <div className="min-w-0">
              <div className="truncate" style={{ ...type.rowSm, color: biya.ink }}>{proposal.payeeName}</div>
              {proposal.reason && (
                <div className="truncate" style={{ ...type.bodySm, color: biya.faint, marginTop: 2 }}>{proposal.reason}</div>
              )}
            </div>
          </div>

          <div style={{ ...type.balance, fontSize: 32, color: biya.ink, marginTop: 14 }}>
            ₦{formatNgn(proposal.ngnMinor)}
          </div>

          {!dismissed && (
            <p style={{ ...type.bodySm, color: biya.muted, marginTop: 8 }}>
              Nothing has moved yet.
            </p>
          )}
        </div>

        {!dismissed && (
          <div className="flex" style={{ gap: 8, padding: "0 15px 15px" }}>
            <button
              onClick={onConfirm}
              className="flex-1 transition-transform active:scale-[0.98]"
              style={{
                height: 44, borderRadius: 12, backgroundColor: biya.action,
                fontFamily: font.sans, fontWeight: 600, fontSize: 14, color: "#fff",
              }}
            >
              Review and pay
            </button>
            <button
              onClick={onDismiss}
              className="transition-transform active:scale-[0.98]"
              style={{
                height: 44, padding: "0 16px", borderRadius: 12, backgroundColor: biya.surface,
                border: `1px solid ${biya.lineStrong}`,
                fontFamily: font.sans, fontWeight: 600, fontSize: 14, color: biya.ink,
              }}
            >
              No, don't
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
