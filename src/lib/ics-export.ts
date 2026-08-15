// توليد ملف .ics (iCalendar) بالكامل بالمتصفح — بدون أي طلب سيرفر. يشتغل
// بتقويم Google وAndroid وApple بنفس الطريقة (معيار مفتوح RFC 5545).
import type { ExamItem, ScheduleDay, SchedulePeriod } from "./data";

const PERIOD_DURATION_MIN = 45; // ما فيه end_time بالجدول — طول الحصة الافتراضي.
const DAY_INDEX_TO_ICS: Record<number, string> = {
  0: "SU", 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR", 6: "SA",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsDate(d: Date) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function escapeIcs(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function foldLine(line: string) {
  // RFC 5545: lines >75 octets يجب تُقسّم — مو ضروري لأغلب سطورنا القصيرة،
  // بس نضيفها احتياط لأسماء مواد/معلمين طويلة.
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  chunks.push(rest);
  return chunks.join("\r\n");
}

function downloadIcs(filename: string, lines: string[]) {
  const content = lines.map(foldLine).join("\r\n");
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** يصدّر الجدول الأسبوعي كأحداث متكررة أسبوعياً (كل حصة = حدث RRULE weekly). */
export function exportScheduleToIcs(days: ScheduleDay[], periodsByDay: Map<string, SchedulePeriod[]>) {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//althura//schedule-export//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:جدول الذرى الذكية",
  ];

  for (const day of days) {
    if (day.is_holiday) continue;
    const periods = periodsByDay.get(day.id) ?? [];
    const icsDay = DAY_INDEX_TO_ICS[day.day_index];
    if (!icsDay) continue;

    for (const p of periods) {
      const [h, m] = (p.start_time || "08:00").split(":").map((x) => parseInt(x, 10) || 0);
      // أول يوم مطابق بهذا الأسبوع الحالي عشان نحسب DTSTART صحيح، ثم RRULE
      // يكرر أسبوعياً على نفس اليوم.
      const start = new Date(now);
      const diff = (day.day_index - start.getDay() + 7) % 7;
      start.setDate(start.getDate() + diff);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + PERIOD_DURATION_MIN * 60_000);

      const title = escapeIcs(p.subject || "حصة دراسية");
      const location = escapeIcs([p.room, p.teacher].filter(Boolean).join(" — "));

      lines.push(
        "BEGIN:VEVENT",
        `UID:schedule-${p.id}@althura.lovable.app`,
        `DTSTAMP:${toIcsDate(now)}Z`,
        `DTSTART:${toIcsDate(start)}`,
        `DTEND:${toIcsDate(end)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${icsDay}`,
        `SUMMARY:${title}`,
        location ? `LOCATION:${location}` : "",
        "END:VEVENT",
      );
    }
  }

  lines.push("END:VCALENDAR");
  downloadIcs("جدول-الذرى.ics", lines.filter(Boolean));
}

/** يصدّر قائمة الامتحانات كأحداث يوم كامل (all-day) بتاريخ كل امتحان. */
export function exportExamsToIcs(exams: ExamItem[]) {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//althura//exams-export//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:امتحانات الذرى الذكية",
  ];

  for (const exam of exams) {
    const d = new Date(exam.exam_date);
    if (Number.isNaN(d.getTime())) continue;
    const dateStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDateStr = `${nextDay.getFullYear()}${pad(nextDay.getMonth() + 1)}${pad(nextDay.getDate())}`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:exam-${exam.id}@althura.lovable.app`,
      `DTSTAMP:${toIcsDate(now)}Z`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${nextDateStr}`,
      `SUMMARY:${escapeIcs(`امتحان ${exam.subject}`)}`,
      exam.description ? `DESCRIPTION:${escapeIcs(exam.description)}` : "",
      // تذكير قبل يوم واحد — مفيد لأي طالب ينسى.
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:تذكير بالامتحان غداً",
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  downloadIcs("امتحانات-الذرى.ics", lines.filter(Boolean));
}
