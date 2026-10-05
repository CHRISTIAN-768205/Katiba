export function isValidBarNumber(barNumber) {
  if (!barNumber || typeof barNumber !== "string") return false;
  const cleaned = barNumber.trim().toUpperCase();
  return [
    /^LSK\/\d{4}\/\d{3,6}$/,       // LSK/2020/12345
    /^P\.\d{2,4}\/\d{3,5}\/\d{4}$/, // P.105/1234/2020
    /^\d{3,5}\/\d{4}$/,             // 1234/2020
  ].some((p) => p.test(cleaned));
}

export function normalizeBarNumber(barNumber) {
  return barNumber.trim().toUpperCase().replace(/\s+/g, "");
}