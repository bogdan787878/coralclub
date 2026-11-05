/**
 * Delivery days and hours of the shop's Russian courier (Moscow, St. Petersburg):
 * the shop sends its schedule in /init (`moscowDeliveryTimes`,
 * `spbDeliveryTimes`) and its own checkout turns it into the days and
 * intervals offered; this is the same rule, read from its checkout:
 *  - the schedule has three variants: `express` (same day), `mkad` (inside the
 *    ring road) and `outside`; each is a list of 7 days, Monday first, with
 *    `skip: 1` for a day on which it delivers, `beforeTime` (the hour up to
 *    which an order still counts for the day) and `times` ("10:00-14:00");
 *  - everything runs on Moscow time;
 *  - express: today if the order is before the cut-off hour, else tomorrow
 *    (one day offered); the others: from tomorrow (after the cut-off: the day
 *    after), seven days on;
 *  - today's intervals that have begun are dropped; `restricted` holds dates
 *    («dd.MM.yyyy») with no delivery.
 */
export type DayTimes = {
  skip?: number | string;
  beforeTime?: number | string;
  times?: string[];
};
export type DeliveryTimes = {
  express?: DayTimes[];
  mkad?: DayTimes[];
  outside?: DayTimes[];
  restricted?: string[];
};
export type SlotDay = {
  /** «Tomorrow, 29 Oct» */
  label: string;
  /** yyyyMMdd, as the shop takes it */
  date: string;
  times: string[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const pad = (n: number) => String(n).padStart(2, "0");

function moscowNow(at: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return {
    y: get("year"),
    m: get("month"),
    d: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function deliverySlots(
  times: DeliveryTimes | undefined,
  {
    express,
    mkad,
    at = new Date(),
  }: { express: boolean; mkad: boolean; at?: Date },
): SlotDay[] {
  const intervals = times?.[express ? "express" : mkad ? "mkad" : "outside"];
  if (!Array.isArray(intervals)) return [];
  const now = moscowNow(at);
  // 0 = Monday
  const today =
    (new Date(Date.UTC(now.y, now.m - 1, now.d)).getUTCDay() + 6) % 7;
  const before = Number(intervals[today]?.beforeTime);
  const late = Number.isFinite(before) && now.hour >= before;
  const start = express ? (late ? 1 : 0) : late ? 2 : 1;
  const end = express ? start + 1 : start + 7;
  const nowHm = `${pad(now.hour)}:${pad(now.minute)}`;
  const restricted = times?.restricted ?? [];

  const days: SlotDay[] = [];
  for (let c = start; c < end; c++) {
    const d = (today + c) % 7;
    const day = intervals[d];
    if (Number(day?.skip) !== 1) continue;
    const date = new Date(Date.UTC(now.y, now.m - 1, now.d + c));
    const dd = pad(date.getUTCDate());
    const mm = pad(date.getUTCMonth() + 1);
    const yyyy = date.getUTCFullYear();
    let slots = Array.isArray(day.times) ? day.times : [];
    // today: only intervals that have not begun
    if (c === 0) slots = slots.filter((s) => s.split("-")[0] > nowHm);
    if (slots.length === 0 || restricted.includes(`${dd}.${mm}.${yyyy}`))
      continue;
    const name =
      c === 0 ? "Today" : c === 1 ? "Tomorrow" : WEEKDAYS[date.getUTCDay()];
    days.push({
      label: `${name}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`,
      date: `${yyyy}${mm}${dd}`,
      times: slots,
    });
  }
  return days;
}

const MOSCOW = ["москва", "moscow", "moskva"];
const SPB = [
  "санкт-петербург",
  "saint petersburg",
  "saint-petersburg",
  "st petersburg",
  "st. petersburg",
  "sankt-peterburg",
];

/** Which courier schedule applies to the city, and for which delivery services. */
export function slotRegion(
  city: string,
  serviceId: string,
): "moscow" | "spb" | null {
  const c = city.trim().toLowerCase();
  if (
    MOSCOW.includes(c) &&
    ["I_COURIER_BALANCE", "I_M_RUNNER", "I_COURIER_1DAY"].includes(serviceId)
  )
    return "moscow";
  if (SPB.includes(c) && serviceId === "I_SPB_RUNNER") return "spb";
  return null;
}
export const isMoscow = (city: string) =>
  MOSCOW.includes(city.trim().toLowerCase());
