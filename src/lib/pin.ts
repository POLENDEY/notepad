const PIN_REGEX = /^\d{6}$/;

export function isValidPin(pin: string): boolean {
  return PIN_REGEX.test(pin);
}

export function normalizePinInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}
