import { createAuditEntry } from "../services/auditLogger.js";
import { changeDetails } from "./diff.js";
import { nextLocalId } from "./ids.js";

export function createStoreContext(state, persist) {
  function audit(
    action,
    resource,
    resourceId = null,
    details = {},
    status = "success",
    actor = null,
    response = null,
  ) {
    const currentUser = state.users.find((user) => user.id === state.currentUserId);
    state.auditLogs.unshift(createAuditEntry({
      actorId: actor?.id ?? currentUser?.id ?? null,
      actorName: actor?.name ?? currentUser?.name ?? "Sistem",
      action,
      resource,
      resourceId,
      status,
      details,
      ipAddress: state.clientContext.ipAddress,
      userAgent: state.clientContext.userAgent,
      response: response || {
        statusCode: status === "success" ? 200 : 400,
        message: status === "success" ? "İşlem başarılı" : "İşlem başarısız",
      },
    }));
    if (state.auditLogs.length > 2000) state.auditLogs.length = 2000;
    persist();
  }

  function recordActivity(entityType, entityId, type, title, description = "") {
    const currentUser = state.users.find((user) => user.id === state.currentUserId);
    const activity = {
      id: nextLocalId(),
      entityType,
      entityId: Number(entityId),
      actorId: currentUser?.id ?? null,
      actorName: currentUser?.name ?? "Sistem",
      type,
      title,
      description,
      createdAt: new Date().toISOString(),
    };
    state.activities.unshift(activity);
    if (entityType === "customer") {
      const customer = state.customers.find((item) => item.id === Number(entityId));
      if (customer) {
        const now = new Date();
        customer.lastContactDate = now.toISOString().slice(0, 10);
        customer.lastContact = now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
      }
    }
    return activity;
  }

  return { state, persist, nextLocalId, changeDetails, audit, recordActivity };
}
