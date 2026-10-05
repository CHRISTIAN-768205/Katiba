export function isValidMediationNumber(num) {
  if (!num || typeof num !== "string") return false;
  return /^MAC\/\d{4}\/\d{3,5}$/.test(num.trim().toUpperCase());
}

export function normalizeMediationNumber(num) {
  return num.trim().toUpperCase().replace(/\s+/g, "");
}