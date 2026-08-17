export function createActivitiesSlice({ state, persist, audit, recordActivity }) {
  return {
    activitiesFor(entityType, entityId) {
      return state.activities
        .filter((activity) => activity.entityType === entityType && activity.entityId === Number(entityId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    recordRequest(method, path, status = "success") {
      audit(
        "request.completed",
        "http",
        path,
        { method, path },
        status,
        null,
        {
          statusCode: status === "success" ? 200 : 500,
          message: status === "success" ? "İstek tamamlandı" : "İstek tamamlanamadı",
        },
      );
    },
    addActivity(entityType, entityId, title, description = "") {
      const activity = recordActivity(entityType, entityId, "note", title, description);
      audit("activity.created", entityType, entityId, { activityId: activity.id, title });
      persist();
      return activity;
    },
  };
}
