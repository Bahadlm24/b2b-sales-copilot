export function createAuditEntry({
  actorId = null,
  actorName = "Sistem",
  action,
  resource,
  resourceId = null,
  status = "success",
  details = {},
  ipAddress = "127.0.0.1",
  userAgent = "local-mock",
  response = { statusCode: 200, message: "İşlem başarılı" },
  timestamp = new Date().toISOString(),
}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp,
    actor: { id: actorId, name: actorName },
    action,
    resource,
    resourceId,
    status,
    ipAddress,
    userAgent,
    response,
    details,
  };
}
