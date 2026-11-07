/**
 * Robust Date Normalizer Utility
 * Extracts { year: 'YYYY', month: 'YYYY-MM', fullDate: 'YYYY-MM-DD' }
 * Handles MongoDB regDate, createdAt ISO timestamps, date, dateStr, etc.
 */

export function getNormalizedDateParts(item) {
  if (!item) return { year: '', month: '', fullDate: '' };

  const raw = typeof item === 'string'
    ? item
    : (
        item.regDate ||
        item.date ||
        item.createdAt ||
        item.dateStr ||
        item.expenseDate ||
        item.registrationDate ||
        item.sampleCollectedAt ||
        item.saleDate ||
        item.recordDate ||
        item.timestamp ||
        item.updatedAt ||
        ''
      );

  if (!raw) return { year: '', month: '', fullDate: '' };

  const str = String(raw).trim();

  // 1. Strict YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split('-');
    return {
      year: parts[0],
      month: `${parts[0]}-${parts[1]}`,
      fullDate: str,
    };
  }

  // 2. ISO timestamp format: YYYY-MM-DDTHH:mm:ss...
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const fullDate = str.split('T')[0];
    const parts = fullDate.split('-');
    return {
      year: parts[0],
      month: `${parts[0]}-${parts[1]}`,
      fullDate,
    };
  }

  // 3. String formats with separators: DD-MM-YYYY, DD/MM/YYYY, YYYY/MM/DD
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return {
        year: y,
        month: `${y}-${m}`,
        fullDate: `${y}-${m}-${d}`,
      };
    } else if (parts[2].length === 4) {
      const y = parts[2];
      const m = parts[1].padStart(2, '0');
      const d = parts[0].padStart(2, '0');
      return {
        year: y,
        month: `${y}-${m}`,
        fullDate: `${y}-${m}-${d}`,
      };
    }
  }

  // 4. Fallback to native Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear().toString();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return {
      year,
      month: `${year}-${month}`,
      fullDate: `${year}-${month}-${day}`,
    };
  }

  return { year: '', month: '', fullDate: '' };
}

export function formatDisplayDate(item, fallback = 'Today') {
  const { fullDate } = getNormalizedDateParts(item);
  return fullDate || fallback;
}
