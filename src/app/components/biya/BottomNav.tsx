import { biya, font } from "./theme";
import { ActivityIcon, ChatIcon, CollectIcon, HomeIcon, PayIcon, ProfileIcon } from "./icons";

// One tab bar for the whole app.
//
// Five slots that never change between personal and business context. Pay is
// promoted out of the label row into a raised centre action, because it is the
// destination a person reaches mid-conversation with a vendor and it should be
// hittable without looking. Code is gone as a tab: it was never a destination,
// it was one of the three modes already inside Pay.
//
// The centre keeps its position and its role in business context but takes that
// context's vocabulary: Collect with the code glyph, because a vendor's
// one-handed action is showing a code, not sending money.
export type TabKey = "home" | "activity" | "chat" | "profile";

const SIDE = [
  { key: "home" as const, label: "Home", Icon: HomeIcon },
  { key: "activity" as const, label: "Activity", Icon: ActivityIcon },
  { key: "chat" as const, label: "Chat", Icon: ChatIcon },
  { key: "profile" as const, label: "Profile", Icon: ProfileIcon },
];

export function BottomNav({
  active, onChange, onCentre, business = false, offline = false, chatUnread = false,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
  onCentre: () => void;
  business?: boolean;
  offline?: boolean;
  chatUnread?: boolean;
}) {
  const left = SIDE.slice(0, 2);
  const right = SIDE.slice(2);
  const Centre = business ? CollectIcon : PayIcon;
  const centreLabel = offline ? "Offline" : business ? "Collect" : "Pay";

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30"
      style={{
        backgroundColor: biya.surface,
        borderTop: `1px solid rgba(14,17,22,0.09)`,
        padding: "9px 6px 0",
        // 22dp home indicator inset when the OS does not give us one.
        paddingBottom: "max(22px, var(--safe-bottom, 0px))",
      }}
    >
      <div className="flex items-end justify-around">
        {left.map((t) => <Slot key={t.key} {...t} active={active === t.key} onClick={() => onChange(t.key)} />)}

        <div className="flex flex-col items-center" style={{ width: 62, gap: 5 }}>
          <button
            onClick={offline ? undefined : onCentre}
            disabled={offline}
            aria-label={centreLabel}
            className="flex items-center justify-center transition-transform active:scale-95 disabled:active:scale-100"
            style={{
              width: 52, height: 52, borderRadius: "50%", marginTop: -20,
              backgroundColor: offline ? biya.disabled : biya.action,
              boxShadow: offline ? "none" : `0 4px 14px ${biya.actionShadow}`,
            }}
          >
            <Centre color={offline ? biya.faint : "#fff"} struck={offline} />
          </button>
          <span
            style={{
              fontFamily: font.sans, fontWeight: offline ? 500 : 600, fontSize: 11, lineHeight: 1,
              color: offline ? biya.faint : biya.ink,
            }}
          >
            {centreLabel}
          </span>
        </div>

        {right.map((t) => (
          <Slot
            key={t.key}
            {...t}
            active={active === t.key}
            unread={t.key === "chat" && chatUnread}
            onClick={() => onChange(t.key)}
          />
        ))}
      </div>
    </div>
  );
}

// Active carries three signals, not one: a filled indigo pill behind the icon,
// the icon switching from stroke to solid, and an indigo 600 label. Inactive is
// a stroked icon at #5B6270, which clears 4.5:1 on white.
function Slot({
  label, Icon, active, unread, onClick,
}: {
  label: string;
  Icon: (p: { size?: number; color?: string; solid?: boolean }) => JSX.Element;
  active: boolean;
  unread?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="flex flex-col items-center transition-opacity active:opacity-70"
      style={{ width: 62, gap: 5 }}
    >
      <span
        className="flex items-center justify-center relative"
        style={{
          width: 46, height: 30, borderRadius: 999,
          backgroundColor: active ? biya.actionWash : "transparent",
        }}
      >
        <Icon solid={active} color={active ? biya.action : biya.muted} />
        {unread && (
          <span
            style={{
              position: "absolute", top: 1, right: 8, width: 8, height: 8,
              borderRadius: "50%", backgroundColor: biya.pending, border: "1.5px solid #fff",
            }}
          />
        )}
      </span>
      <span
        style={{
          fontFamily: font.sans, fontWeight: active ? 600 : 500, fontSize: 11, lineHeight: 1,
          color: active ? biya.action : biya.muted,
        }}
      >
        {label}
      </span>
    </button>
  );
}
