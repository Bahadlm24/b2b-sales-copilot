import { t } from "../../i18n/localeStore.js";

export function createLookupsSlice({ state }) {
  return {
    can(permission) {
      const user = state.users.find((item) => item.id === state.currentUserId);
      return Boolean(user?.active && user.permissions?.includes(permission));
    },
    roleLabel(roleKey) {
      const translated = t(`roles.${roleKey}`);
      if (translated !== `roles.${roleKey}`) return translated;
      return state.roleDefinitions.find((role) => role.key === roleKey)?.label || t("roles.unknown");
    },
    setClientContext(context) {
      state.clientContext = {
        ipAddress: context.ipAddress || "127.0.0.1",
        userAgent: context.userAgent || "local-mock",
      };
    },
    customerName(customerId) {
      return state.customers.find((customer) => customer.id === Number(customerId))?.name || t("store.unknownCustomer");
    },
    userName(userId) {
      return state.users.find((user) => user.id === Number(userId))?.name || t("store.unassigned");
    },
    journeyEntityName(journey) {
      return journey.entityType === "lead"
        ? state.leads.find((item) => item.id === Number(journey.entityId))?.company || state.leads.find((item) => item.id === Number(journey.entityId))?.name || t("store.unknownLead")
        : this.customerName(journey.entityId);
    },
  };
}
