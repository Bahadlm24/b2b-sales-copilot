export function createTasksSlice({ state, persist, nextLocalId, changeDetails, audit, recordActivity }) {
  return {
    addTask(task) {
      const record = { ...task, id: nextLocalId(), ownerId: Number(task.ownerId) || state.currentUserId, status: "Bekliyor", completed: false };
      state.tasks.unshift(record);
      recordActivity("customer", record.customerId, "task", "Takip görevi oluşturuldu", record.title);
      audit("task.created", "task", record.id, { title: record.title });
      persist();
    },
    toggleTask(id) {
      const task = state.tasks.find((item) => item.id === id);
      if (task) {
        const before = { status: task.status, completed: task.completed };
        task.completed = !task.completed;
        task.status = task.completed ? "Tamamlandı" : "Bekliyor";
        recordActivity("customer", task.customerId, "task", task.completed ? "Takip görevi tamamlandı" : "Takip görevi yeniden açıldı", task.title);
        audit("task.status_changed", "task", task.id, changeDetails(before, { status: task.status, completed: task.completed }));
        persist();
      }
    },
    updateTaskStatus(id, status) {
      const task = state.tasks.find((item) => item.id === id);
      if (!task || !["Bekliyor", "Devam ediyor", "Tamamlandı"].includes(status)) return;
      const before = { status: task.status, completed: task.completed };
      task.status = status;
      task.completed = status === "Tamamlandı";
      recordActivity("customer", task.customerId, "task", "Görev aşaması güncellendi", `${task.title}: ${status}`);
      audit("task.status_changed", "task", task.id, changeDetails(before, { status: task.status, completed: task.completed }));
      persist();
    },
    updateTask(id, changes) {
      const task = state.tasks.find((item) => item.id === Number(id));
      if (!task || !changes.title?.trim() || !changes.dueDate) return false;
      const before = { title: task.title, dueDate: task.dueDate, priority: task.priority, ownerId: task.ownerId, customerId: task.customerId };
      Object.assign(task, {
        title: changes.title.trim(),
        dueDate: changes.dueDate,
        priority: changes.priority || task.priority,
        ownerId: Number(changes.ownerId) || task.ownerId || state.currentUserId,
        customerId: Number(changes.customerId) || task.customerId,
        updatedAt: new Date().toISOString(),
      });
      const after = { title: task.title, dueDate: task.dueDate, priority: task.priority, ownerId: task.ownerId, customerId: task.customerId };
      recordActivity("customer", task.customerId, "task", "Takip görevi güncellendi", task.title);
      audit("task.updated", "task", task.id, changeDetails(before, after));
      persist();
      return true;
    },
    removeTask(id) {
      const task = state.tasks.find((item) => item.id === id);
      state.tasks = state.tasks.filter((item) => item.id !== id);
      if (task) recordActivity("customer", task.customerId, "task", "Takip görevi silindi", task.title);
      audit("task.deleted", "task", id);
      persist();
    },
  };
}
