const pad = (n) => String(n).padStart(2, '0');

/** Today's date as YYYY-MM-DD in the browser's local time zone. */
export function todayLocal(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Fixed list rather than toLocaleString: browsers differ ("Sep" vs "Sept").
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-10-15' -> '15 Oct 2026' (no time-zone conversion). */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** '2026-10-01', '2026-10-15' -> '1 Oct – 15 Oct 2026' */
export function formatRange(from, to) {
  if (from === to) return formatDate(from);
  const [fy] = from.split('-');
  const [ty] = to.split('-');
  const fromText = formatDate(from);
  return `${fy === ty ? fromText.replace(` ${fy}`, '') : fromText} – ${formatDate(to)}`;
}
