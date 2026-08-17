export function createLookupsSlice({ state }) {
  return {
    can(permission) {
      const user = state.users.find((item) => item.id === state.currentUserId);
      return Boolean(user?.active && user.permissions?.includes(permission));
    },
    roleLabel(roleKey) {
      return state.roleDefinitions.find((role) => role.key === roleKey)?.label || "Tanımsız rol";
    },
    setClientContext(context) {
      state.clientContext = {
        ipAddress: context.ipAddress || "127.0.0.1",
        userAgent: context.userAgent || "local-mock",
      };
    },
    customerName(customerId) {
      return state.customers.find((customer) => customer.id === Number(customerId))?.name || "Bilinmeyen müşteri";
    },
    userName(userId) {
      return state.users.find((user) => user.id === Number(userId))?.name || "Atanmamış";
    },
    journeyEntityName(journey) {
      return journey.entityType === "lead"
        ? state.leads.find((item) => item.id === Number(journey.entityId))?.company || state.leads.find((item) => item.id === Number(journey.entityId))?.name || "Bilinmeyen lead"
        : this.customerName(journey.entityId);
    },
  };
}
