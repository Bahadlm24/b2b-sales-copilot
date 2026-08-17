import { computed, ref } from "vue";
import { t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";

export function useNotifications() {
  const notificationsOpen = ref(false);
  const notifications = computed(() => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const items = [];
    salesStore.state.tasks.filter((task) => !task.completed && task.dueDate < todayKey).forEach((task) => {
      items.push({ id: `task-${task.id}`, type: t("notify.task"), text: t("notify.taskOverdue", { title: task.title }), to: "/tasks" });
    });
    salesStore.activeOffers.value.forEach((offer) => {
      const date = new Date(`${offer.validUntil}T00:00:00`);
      const days = Math.ceil((date - today) / 86400000);
      if (Number.isFinite(days) && days >= 0 && days <= 7) items.push({ id: `offer-${offer.id}`, type: t("notify.offer"), text: t("notify.offerDays", { no: offer.no, days }), to: `/offers/${offer.id}` });
    });
    salesStore.customers.filter((customer) => !customer.archived).forEach((customer) => {
      const days = Math.floor((today - new Date(`${customer.lastContactDate}T00:00:00`)) / 86400000);
      if (days >= 10) items.push({ id: `customer-${customer.id}`, type: t("notify.customer"), text: t("notify.noContact", { name: customer.name, days }), to: `/customers/${customer.id}` });
    });
    salesStore.state.meetingJourneys.filter((meeting) => !["Olumlu", "Olumsuz", "Görüşme sağlandı"].includes(meeting.status)).forEach((meeting) => {
      const hours = Math.ceil((new Date(meeting.scheduledAt) - today) / 3600000);
      const name = salesStore.journeyEntityName(meeting);
      if (hours >= 0 && hours <= 48) items.push({ id: `journey-${meeting.id}`, type: t("notify.meeting"), text: t("notify.meetingSoon", { name, hours }), to: "/meeting-tracker" });
      if (hours < 0) items.push({ id: `journey-overdue-${meeting.id}`, type: t("notify.overdueMeeting"), text: t("notify.meetingResultMissing", { name }), to: "/meeting-tracker" });
    });
    salesStore.state.productUpdates.filter((update) => !salesStore.state.readProductUpdates.includes(update.version)).forEach((update) => {
      items.push({ id: `update-${update.version}`, type: t("notify.update", { version: update.version }), text: update.message, to: "/settings", updateVersion: update.version });
    });
    return items.slice(0, 20);
  });

  function openNotification(item) {
    if (item.updateVersion) salesStore.markProductUpdateRead(item.updateVersion);
    notificationsOpen.value = false;
  }

  return { notificationsOpen, notifications, openNotification };
}
