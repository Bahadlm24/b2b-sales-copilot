import { formatPhoneNumber } from "./phoneFormatter.js";
import { t } from "../i18n/localeStore.js";

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[\s_-]+/g, "");
}

function valueFromAliases(row, aliases) {
  const entries = Object.entries(row);
  const match = entries.find(([key]) => aliases.includes(normalizeHeader(key)));
  return match ? String(match[1] ?? "").trim() : "";
}

export function phoneKey(value) {
  return formatPhoneNumber(value).replace(/\D/g, "");
}

export function prepareLeadImport(rows, existingLeads = []) {
  const existingPhones = new Set(existingLeads.map((lead) => phoneKey(lead.phone)).filter(Boolean));
  const filePhones = new Set();

  return rows.map((row, index) => {
    const firstName = valueFromAliases(row, ["ad", "isim", "firstname"]);
    const lastName = valueFromAliases(row, ["soyad", "soyisim", "lastname"]);
    const phoneInput = valueFromAliases(row, ["telefon", "telefonno", "telefonnumarası", "telefonnumarasi", "phone", "gsm"]);
    const email = valueFromAliases(row, ["mail", "email", "eposta", "epostaadresi"]);
    const phone = formatPhoneNumber(phoneInput);
    const key = phoneKey(phone);
    let status = "ready";
    let message = t("importer.ready");

    if (!phoneInput) {
      status = "error";
      message = t("importer.phoneRequired");
    } else if (key.length < 7) {
      status = "error";
      message = t("importer.phoneInvalid");
    } else if (existingPhones.has(key) || filePhones.has(key)) {
      status = "duplicate";
      message = t("importer.duplicate");
    } else {
      filePhones.add(key);
    }

    return {
      rowNumber: index + 2,
      firstName,
      lastName,
      phone,
      email,
      status,
      message,
    };
  });
}
