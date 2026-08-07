import { biya, DAY, font, type } from "./theme";
import { Card, Screen } from "./primitives";
import { ActivityLine, startOfToday } from "./Home";
import type { ActivityRow } from "../../../lib/api";

function groupLabel(ts: number): string {
  if (ts >= startOfToday()) return "Today";
  if (ts >= startOfToday() - DAY) return "Yesterday";
  return "Earlier";
}

export function Activity({ rows }: { rows: ActivityRow[] }) {
  const groups: Record<string, ActivityRow[]> = {};
  for (const r of rows) (groups[groupLabel(r.createdAt)] ??= []).push(r);
  const order = ["Today", "Yesterday", "Earlier"].filter((g) => groups[g]);

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: biya.ground, paddingBottom: 132 }}>
      <header style={{ padding: "0 20px 12px", paddingTop: "calc(22px + var(--safe-top, 0px))" }}>
        <h1 style={{ ...type.title, color: biya.ink }}>Activity</h1>
        <p style={{ ...type.body, color: biya.faint, marginTop: 4 }}>Every movement, in and out</p>
      </header>

      {rows.length === 0 ? (
        <div style={{ padding: "0 20px" }}>
          <Card>
            <div className="text-center" style={{ padding: "40px 24px" }}>
              <p style={{ ...type.row, fontSize: 16, color: biya.ink }}>Nothing here yet</p>
              <p style={{ ...type.body, color: biya.faint, marginTop: 6 }}>
                Your payments will show up here as they happen.
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <div style={{ padding: "0 20px" }}>
          {order.map((g) => (
            <div key={g} style={{ marginBottom: 14 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontFamily: font.mono, fontSize: 10.5, letterSpacing: "0.07em", textTransform: "uppercase", color: biya.faint }}>
                  {g}
                </span>
              </div>
              <Card>
                {groups[g].map((row, i, arr) => (
                  <ActivityLine key={row.id} row={row} last={i === arr.length - 1} />
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
