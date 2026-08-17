import { computed, ref } from "vue";
import { salesStore } from "../stores/salesStore";

export function useNotifications() {
  const notificationsOpen = ref(false);
  const notifications = computed(() => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const items = [];
    salesStore.state.tasks.filter((task) => !task.completed && task.dueDate < todayKey).forEach((task) => {
      items.push({ id: `task-${task.id}`, type: "Görev", text: `${task.title} gecikti`, to: "/tasks" });
    });
    salesStore.activeOffers.value.forEach((offer) => {
      const date = new Date(`${offer.validUntil}T00:00:00`);
      const days = Math.ceil((date - today) / 86400000);
      if (Number.isFinite(days) && days >= 0 && days <= 7) items.push({ id: `offer-${offer.id}`, type: "Teklif", text: `${offer.no} için ${days} gün kaldı`, to: `/offers/${offer.id}` });
    });
    salesStore.customers.filter((customer) => !customer.archived).forEach((customer) => {
      const days = Math.floor((today - new Date(`${customer.lastContactDate}T00:00:00`)) / 86400000);
      if (days >= 10) items.push({ id: `customer-${customer.id}`, type: "Müşteri", text: `${customer.name}: ${days} gündür temas yok`, to: `/customers/${customer.id}` });
    });
    salesStore.state.meetingJourneys.filter((meeting) => !["Olumlu", "Olumsuz", "Görüşme sağlandı"].includes(meeting.status)).forEach((meeting) => {
      const hours = Math.ceil((new Date(meeting.scheduledAt) - today) / 3600000);
      if (hours >= 0 && hours <= 48) items.push({ id: `journey-${meeting.id}`, type: "Toplantı", text: `${salesStore.journeyEntityName(meeting)} görüşmesine ${hours} saat kaldı`, to: "/meeting-tracker" });
      if (hours < 0) items.push({ id: `journey-overdue-${meeting.id}`, type: "Geciken görüşme", text: `${salesStore.journeyEntityName(meeting)} için sonuç girilmedi`, to: "/meeting-tracker" });
    });
    salesStore.state.productUpdates.filter((update) => !salesStore.state.readProductUpdates.includes(update.version)).forEach((update) => {
      items.push({ id: `update-${update.version}`, type: `Güncelleme ${update.version}`, text: update.message, to: "/settings", updateVersion: update.version });
    });
    return items.slice(0, 20);
  });

  function openNotification(item) {
    if (item.updateVersion) salesStore.markProductUpdateRead(item.updateVersion);
    notificationsOpen.value = false;
  }

  return { notificationsOpen, notifications, openNotification };
}
