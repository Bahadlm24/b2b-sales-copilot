export function createOffersSlice({ state, persist, nextLocalId, changeDetails, audit, recordActivity }) {
  const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
  return {
    updateOffer(id, changes) {
      const offer = state.offers.find((item) => item.id === Number(id));
      if (!offer) return false;
      const before = {
        title: offer.title, status: offer.status, probability: offer.probability,
        validUntil: offer.validUntil, numericAmount: offer.numericAmount, amount: offer.amount,
        ownerId: offer.ownerId, outcomeReason: offer.outcomeReason || "",
      };
      const numericAmount = Number(changes.numericAmount ?? offer.numericAmount);
      if (["Kazanıldı", "Kaybedildi"].includes(changes.status) && !changes.outcomeReason?.trim()) return false;
      Object.assign(offer, {
        title: changes.title?.trim() || offer.title,
        status: changes.status || offer.status,
        probability: Number(changes.probability ?? offer.probability),
        validUntil: changes.validUntil?.trim() || offer.validUntil,
        numericAmount,
        amount: money.format(numericAmount),
        ownerId: Number(changes.ownerId) || offer.ownerId || state.currentUserId,
        outcomeReason: ["Kazanıldı", "Kaybedildi"].includes(changes.status)
          ? changes.outcomeReason?.trim() || offer.outcomeReason || ""
          : "",
        updatedAt: new Date().toISOString(),
      });
      recordActivity("customer", offer.customerId, "offer", "Teklif güncellendi", `${offer.no} · ${offer.status} · %${offer.probability}`);
      const after = {
        title: offer.title, status: offer.status, probability: offer.probability,
        validUntil: offer.validUntil, numericAmount: offer.numericAmount, amount: offer.amount,
        ownerId: offer.ownerId, outcomeReason: offer.outcomeReason,
      };
      const revision = { id: nextLocalId(), createdAt: new Date().toISOString(), actorName: state.users.find((user) => user.id === state.currentUserId)?.name || "Sistem", ...changeDetails(before, after) };
      if (revision.changedFields.length) offer.revisions.unshift(revision);
      audit("offer.updated", "offer", offer.id, changeDetails(before, after));
      persist();
      return true;
    },
    archiveOffer(id, archived = true) {
      const offer = state.offers.find((item) => item.id === Number(id));
      if (!offer) return false;
      const before = { archived: Boolean(offer.archived) };
      offer.archived = Boolean(archived);
      offer.archivedAt = offer.archived ? new Date().toISOString() : null;
      audit("offer.archive_changed", "offer", offer.id, changeDetails(before, { archived: offer.archived }));
      persist();
      return true;
    },
    cancelOffer(id, reason) {
      const offer = state.offers.find((item) => item.id === Number(id));
      if (!offer || !reason?.trim()) return false;
      const before = { cancelled: Boolean(offer.cancelled), status: offer.status, outcomeReason: offer.outcomeReason };
      offer.cancelled = true;
      offer.status = "İptal";
      offer.outcomeReason = reason.trim();
      offer.updatedAt = new Date().toISOString();
      const after = { cancelled: offer.cancelled, status: offer.status, outcomeReason: offer.outcomeReason };
      offer.revisions.unshift({ id: nextLocalId(), createdAt: offer.updatedAt, actorName: state.users.find((user) => user.id === state.currentUserId)?.name || "Sistem", ...changeDetails(before, after) });
      recordActivity("customer", offer.customerId, "offer", "Teklif iptal edildi", offer.outcomeReason);
      audit("offer.cancelled", "offer", offer.id, changeDetails(before, after));
      persist();
      return true;
    },
    addOffer(offer) {
      const customer = state.customers.find((item) => item.id === Number(offer.customerId) && !item.archived);
      const numericAmount = Number(offer.numericAmount);
      if (!customer || !offer.title?.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
        return { ok: false, message: "Müşteri, teklif başlığı ve sıfırdan büyük tutar zorunludur." };
      }
      const year = new Date().getFullYear();
      const sequence = String(state.offers.length + 1).padStart(4, "0");
      const record = {
        id: nextLocalId(),
        customerId: customer.id,
        customer: customer.name,
        no: `TKL-${year}-${sequence}`,
        title: offer.title.trim(),
        amount: money.format(numericAmount),
        numericAmount,
        status: "Hazırlanıyor",
        validUntil: offer.validUntil,
        probability: Number(offer.probability) || 50,
        ownerId: Number(offer.ownerId) || state.currentUserId,
        outcomeReason: "",
        revisions: [],
        createdAt: new Date().toISOString(),
      };
      state.offers.unshift(record);
      recordActivity("customer", customer.id, "offer", "Yeni teklif oluşturuldu", `${record.no} · ${record.amount}`);
      audit("offer.created", "offer", record.id, { customerId: customer.id, title: record.title, numericAmount });
      persist();
      return { ok: true, offer: record };
    },
  };
}
