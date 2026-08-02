export function formatPhoneNumber(value) {
  const input = String(value ?? "").trim();
  if (!input) return "";

  const digits = input.replace(/\D/g, "");
  let nationalNumber = "";

  if (input.startsWith("+90") && digits.length === 12) nationalNumber = digits.slice(2);
  else if (input.startsWith("0090") && digits.length === 14) nationalNumber = digits.slice(4);
  else if (!input.startsWith("+") && digits.startsWith("90") && digits.length === 12) nationalNumber = digits.slice(2);
  else if (!input.startsWith("+") && digits.startsWith("0") && digits.length === 11) nationalNumber = digits.slice(1);
  else if (!input.startsWith("+") && !input.startsWith("00") && digits.length === 10) nationalNumber = digits;

  if (nationalNumber.length === 10) {
    return `+90 ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3, 6)} ${nationalNumber.slice(6, 8)} ${nationalNumber.slice(8, 10)}`;
  }

  return input;
}
