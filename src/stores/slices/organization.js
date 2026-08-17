import { t } from "../../i18n/localeStore.js";

export function createOrganizationSlice({ state, persist, changeDetails, audit }) {
  return {
    markProductUpdateRead(version) {
      if (!state.readProductUpdates.includes(version)) state.readProductUpdates.push(version);
      persist();
    },
    updateOrganizationBranding(changes) {
      const name = changes.name?.trim();
      const productName = changes.productName?.trim();
      const brandMark = changes.brandMark?.trim().slice(0, 3).toLocaleUpperCase("tr-TR");
      if (!name || !productName || !brandMark) return { ok: false, message: t("store.brandingRequired") };
      const before = { name: state.organization.name, productName: state.organization.productName, brandMark: state.organization.brandMark };
      Object.assign(state.organization, { name, productName, brandMark });
      audit("organization.branding_updated", "organization", state.organization.id, changeDetails(before, { name, productName, brandMark }));
      persist();
      return { ok: true, message: t("store.brandingSaved") };
    },
  };
}
