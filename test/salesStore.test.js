import test from "node:test";
import assert from "node:assert/strict";
import { salesStore } from "../src/stores/salesStore.js";

test("pipeline toplamlarını tekliflerden hesaplar", () => {
  const total = salesStore.offers.reduce((sum, offer) => sum + offer.numericAmount, 0);
  const weighted = salesStore.offers.reduce((sum, offer) => sum + offer.numericAmount * offer.probability / 100, 0);

  assert.equal(salesStore.pipelineValue.value, total);
  assert.equal(salesStore.weightedPipeline.value, weighted);
});

test("görev ekleme, tamamlama ve silme akışını yönetir", () => {
  salesStore.addTask({ customerId: 1, title: "Test görevi", dueDate: "2026-08-10", priority: "Orta" });
  const task = salesStore.state.tasks[0];

  assert.equal(task.completed, false);
  salesStore.toggleTask(task.id);
  assert.equal(task.completed, true);
  salesStore.removeTask(task.id);
  assert.equal(salesStore.state.tasks.some((item) => item.id === task.id), false);
});

test("müşteri kimliğini görünen ada dönüştürür", () => {
  assert.equal(salesStore.customerName(1), "Atlas Endüstri A.Ş.");
  assert.equal(salesStore.customerName(999), "Bilinmeyen müşteri");
});

test("kullanıcı e-postalarını benzersiz tutar", () => {
  const duplicate = salesStore.addUser({
    name: "Başka Kullanıcı",
    username: "baska",
    email: salesStore.state.users[0].email.toUpperCase(),
    password: "1234",
    role: "representative",
  });

  assert.equal(duplicate.ok, false);
});

test("kullanıcı ekleme ve silme akışını yönetir", () => {
  const result = salesStore.addUser({
    name: "Test Kullanıcısı",
    username: "test-user",
    email: "test-user@salescopilot.local",
    password: "1234",
    role: "analyst",
  });
  const user = salesStore.state.users.find((item) => item.email === "test-user@salescopilot.local");

  assert.equal(result.ok, true);
  assert.equal(user.role, "analyst");
  assert.equal(salesStore.removeUser(user.id), true);
});

test("admin mock hesabıyla giriş ve çıkış yapılabilir", () => {
  const result = salesStore.login("ADMIN", "1234");

  assert.equal(result.ok, true);
  assert.equal(salesStore.isAuthenticated.value, true);
  assert.equal(salesStore.currentUser.value.role, "admin");
  salesStore.logout();
  assert.equal(salesStore.isAuthenticated.value, false);
});

test("hatalı şifreyi reddeder", () => {
  const result = salesStore.login("admin", "yanlış");

  assert.equal(result.ok, false);
  assert.equal(salesStore.isAuthenticated.value, false);
});

test("şifre hatırlatma mock e-posta oluşturur", () => {
  const count = salesStore.state.mailOutbox.length;
  const result = salesStore.requestPasswordReminder(salesStore.state.users[0].email);

  assert.equal(result.ok, true);
  assert.equal(salesStore.state.mailOutbox.length, count + 1);
  assert.equal(salesStore.state.mailOutbox[0].to, salesStore.state.users[0].email);
});

test("lead eklerken Türkiye telefonunu normalize eder", () => {
  const lead = salesStore.addLead({
    name: "Lead Test",
    company: "Test A.Ş.",
    phone: "0530 505 66 48",
    email: "lead@test.local",
    source: "Web Form",
    campaign: "Test",
    score: 75,
  });

  assert.equal(lead.phone, "+90 530 505 66 48");
  assert.equal(lead.status, "Yeni");
  assert.equal(salesStore.state.leads[0].id, lead.id);
});

test("kullanıcı iznini dinamik olarak açıp kapatır", () => {
  const user = salesStore.state.users.find((item) => item.role === "representative");
  const hadAnalytics = user.permissions.includes("analytics");

  salesStore.toggleUserPermission(user.id, "analytics");
  assert.equal(user.permissions.includes("analytics"), !hadAnalytics);
  salesStore.toggleUserPermission(user.id, "analytics");
  assert.equal(user.permissions.includes("analytics"), hadAnalytics);
});

test("departman ve takım atamasını kullanıcıya uygular", () => {
  const user = salesStore.state.users[1];
  salesStore.updateUserOrganization(user.id, 2, 3);

  assert.equal(user.departmentId, 2);
  assert.equal(user.teamId, 3);
});

test("süresi dolan oturum tokenını yeniler", () => {
  salesStore.login("admin", "1234");
  const firstToken = salesStore.state.tokenSession.accessToken;
  const afterExpiry = salesStore.state.tokenSession.expiresAt + 1;

  assert.equal(salesStore.ensureToken(afterExpiry), true);
  assert.notEqual(salesStore.state.tokenSession.accessToken, firstToken);
  assert.equal(salesStore.state.tokenSession.refreshCount, 1);
  salesStore.logout();
});

test("dinamik rol ekler, izinlerini değiştirir ve siler", () => {
  const result = salesStore.addRole("Test Dinamik Rol");
  const role = salesStore.state.roleDefinitions.find((item) => item.label === "Test Dinamik Rol");

  assert.equal(result, true);
  assert.deepEqual(role.permissions, ["dashboard"]);
  salesStore.toggleRolePermission(role.key, "leads");
  assert.equal(role.permissions.includes("leads"), true);
  assert.equal(salesStore.removeRole(role.key), true);
  assert.equal(salesStore.state.roleDefinitions.some((item) => item.key === role.key), false);
});

test("kullanıcıya atanmış rolü silmez", () => {
  const assignedRole = salesStore.state.users[0].role;

  assert.equal(salesStore.removeRole(assignedRole), false);
});

test("kullanıcı işlemini audit geçmişine kaydeder", () => {
  const taskTitle = "Audit test görevi";
  salesStore.addTask({ customerId: 1, title: taskTitle, dueDate: "2026-08-10", priority: "Orta" });
  const log = salesStore.state.auditLogs.find((item) => item.action === "task.created" && item.details.title === taskTitle);

  assert.ok(log);
  assert.equal(log.resource, "task");
});

test("zamanı gelen mecra senkronizasyonunu çalıştırır", () => {
  salesStore.state.syncSettings.enabled = true;
  salesStore.state.syncSettings.nextSyncAt = 1_000;

  assert.equal(salesStore.syncExternalLeads(1_001), true);
  assert.equal(salesStore.state.syncSettings.lastSyncAt, 1_001);
  const log = salesStore.state.auditLogs.find((item) => item.action === "sync.completed");
  assert.ok(log);
  assert.ok(log.details.updated > 0);
  assert.ok(salesStore.state.leads.some((lead) => lead.lastSyncedAt === new Date(1_001).toISOString()));
});

test("müşteri aktivitesini ilgili kayıt ve personelle ilişkilendirir", () => {
  salesStore.login("admin", "1234");
  const activity = salesStore.addActivity("customer", 1, "Test müşteri notu", "İlişkisel aktivite testi");
  const customerActivities = salesStore.activitiesFor("customer", 1);

  assert.equal(activity.entityType, "customer");
  assert.equal(activity.entityId, 1);
  assert.equal(activity.actorName, "Bahadır Perveli");
  assert.ok(customerActivities.some((item) => item.id === activity.id));
  salesStore.logout();
});

test("lead durum değişikliğini aktivite zaman çizelgesine ekler", () => {
  const lead = salesStore.state.leads[0];
  salesStore.updateLeadStatus(lead.id, "Nitelikli");
  const activity = salesStore.activitiesFor("lead", lead.id).find((item) => item.type === "status");

  assert.ok(activity);
  assert.match(activity.description, /Nitelikli/);
});

test("başarısız girişin response ve IP bilgisini audit kaydına ekler", () => {
  salesStore.setClientContext({ ipAddress: "192.0.2.25", userAgent: "Test Agent" });
  salesStore.login("admin", "hatalı-şifre");
  const log = salesStore.state.auditLogs.find((item) => item.action === "auth.login_failed");

  assert.equal(log.ipAddress, "192.0.2.25");
  assert.equal(log.userAgent, "Test Agent");
  assert.equal(log.response.statusCode, 401);
  assert.equal(log.response.message, "Kullanıcı adı veya şifre hatalı");
});

test("şifre hatırlatma isteğini eşleşme sonucuyla loglar", () => {
  salesStore.requestPasswordReminder("bilinmeyen@example.com");
  const log = salesStore.state.auditLogs.find((item) => item.action === "auth.password_reminder_requested");

  assert.equal(log.response.statusCode, 202);
  assert.equal(log.details.accountMatched, false);
});

test("görev aşamasını günceller ve tamamlanan kartı store içinde tutar", () => {
  salesStore.addTask({ customerId: 1, title: "Aşama test görevi", dueDate: "2026-08-20", priority: "Orta" });
  const task = salesStore.state.tasks.find((item) => item.title === "Aşama test görevi");
  salesStore.updateTaskStatus(task.id, "Tamamlandı");

  assert.equal(task.completed, true);
  assert.equal(task.status, "Tamamlandı");
  assert.ok(salesStore.state.tasks.some((item) => item.id === task.id));
});

test("toplantı kaydını günceller ve silebilir", () => {
  const meeting = salesStore.saveMeeting({ customerId: 1, transcript: "İlk metin", wordCount: 2, insights: [] });
  assert.equal(salesStore.updateMeeting(meeting.id, "Güncellenmiş toplantı metni"), true);
  assert.equal(meeting.transcript, "Güncellenmiş toplantı metni");
  assert.equal(salesStore.deleteMeeting(meeting.id), true);
  assert.equal(salesStore.state.meetings.some((item) => item.id === meeting.id), false);
});

test("lead ve teklif detaylarını günceller", () => {
  const lead = salesStore.state.leads[0];
  const offer = salesStore.state.offers[0];

  assert.equal(salesStore.updateLead(lead.id, { name: "Güncel Lead", score: 91, status: "Nitelikli" }), true);
  assert.equal(lead.name, "Güncel Lead");
  assert.equal(lead.score, 91);
  assert.equal(salesStore.updateOffer(offer.id, { status: "Karar", probability: 93, numericAmount: 1300000 }), true);
  assert.equal(offer.status, "Karar");
  assert.equal(offer.probability, 93);
  assert.equal(offer.numericAmount, 1300000);
});

test("manuel müşteri ekler, telefonu biçimlendirir ve mükerrer kaydı engeller", () => {
  const phone = `0530 777 ${String(Date.now()).slice(-2)} 44`;
  const result = salesStore.addCustomer({
    name: "Test Müşteri A.Ş.",
    contact: "Test Yetkili",
    phone,
    stage: "İlk görüşme",
    score: 65,
  });

  assert.equal(result.ok, true);
  assert.match(result.customer.phone, /^\+90 /);
  assert.ok(salesStore.customers.some((item) => item.id === result.customer.id));
  assert.equal(salesStore.addCustomer({ name: "Mükerrer", phone }).ok, false);
  assert.ok(salesStore.activitiesFor("customer", result.customer.id).length > 0);
  assert.ok(salesStore.state.auditLogs.some((item) => item.action === "customer.created" && item.resourceId === result.customer.id));
});

test("müşteri güncellemesinde audit kaydı eski ve yeni değerleri gösterir", () => {
  const created = salesStore.addCustomer({
    name: "tst",
    phone: `0531 888 ${String(Date.now()).slice(-2)} 55`,
  });
  const updated = salesStore.updateCustomer(created.customer.id, {
    ...created.customer,
    name: "tstt",
  });
  const log = salesStore.state.auditLogs.find(
    (item) => item.action === "customer.updated" && item.resourceId === created.customer.id,
  );

  assert.equal(updated.ok, true);
  assert.equal(updated.customer.name, "tstt");
  assert.equal(log.details.before.name, "tst");
  assert.equal(log.details.after.name, "tstt");
  assert.ok(log.details.changedFields.includes("name"));
});

test("lead, teklif, görev ve toplantı güncellemeleri tüm değişen alanları audit kaydına alır", () => {
  const lead = salesStore.state.leads[0];
  const oldLeadCompany = lead.company;
  salesStore.updateLead(lead.id, { ...lead, company: `${oldLeadCompany} Güncel`, score: 97 });
  const leadLog = salesStore.state.auditLogs.find((item) => item.action === "lead.updated" && item.resourceId === lead.id);
  assert.equal(leadLog.details.before.company, oldLeadCompany);
  assert.equal(leadLog.details.after.company, `${oldLeadCompany} Güncel`);
  assert.ok(leadLog.details.changedFields.includes("company"));
  assert.ok(leadLog.details.changedFields.includes("score"));

  const offer = salesStore.state.offers[0];
  const oldOfferTitle = offer.title;
  salesStore.updateOffer(offer.id, { ...offer, title: `${oldOfferTitle} Güncel`, probability: 81 });
  const offerLog = salesStore.state.auditLogs.find((item) => item.action === "offer.updated" && item.resourceId === offer.id);
  assert.equal(offerLog.details.before.title, oldOfferTitle);
  assert.equal(offerLog.details.after.title, `${oldOfferTitle} Güncel`);
  assert.ok(offerLog.details.changedFields.includes("probability"));

  const task = salesStore.state.tasks[0];
  const oldTaskStatus = task.status;
  salesStore.updateTaskStatus(task.id, oldTaskStatus === "Tamamlandı" ? "Bekliyor" : "Tamamlandı");
  const taskLog = salesStore.state.auditLogs.find((item) => item.action === "task.status_changed" && item.resourceId === task.id);
  assert.equal(taskLog.details.before.status, oldTaskStatus);
  assert.notEqual(taskLog.details.after.status, oldTaskStatus);

  const meeting = salesStore.saveMeeting({ customerId: 1, transcript: "Eski toplantı metni", wordCount: 3, insights: [] });
  salesStore.updateMeeting(meeting.id, "Yeni toplantı metni güncellendi");
  const meetingLog = salesStore.state.auditLogs.find((item) => item.action === "meeting.updated" && item.resourceId === meeting.id);
  assert.equal(meetingLog.details.before.transcript, "Eski toplantı metni");
  assert.equal(meetingLog.details.after.transcript, "Yeni toplantı metni güncellendi");
});

test("lead kaydını müşteriyle ilişkilendirerek dönüştürür", () => {
  const lead = salesStore.addLead({
    name: "Dönüşüm Yetkilisi",
    company: `Dönüşüm ${Date.now()}`,
    phone: `0532 999 ${String(Date.now()).slice(-2)} 66`,
    email: "donusum@example.com",
    source: "Manuel",
    score: 79,
  });
  const result = salesStore.convertLeadToCustomer(lead.id);

  assert.equal(result.ok, true);
  assert.equal(lead.status, "Müşteriye dönüştü");
  assert.equal(lead.convertedCustomerId, result.customer.id);
  assert.equal(result.customer.ownerId, lead.ownerId);
  assert.equal(salesStore.convertLeadToCustomer(lead.id).ok, false);
});

test("teklif oluşturur, revizyonu ve sonuç nedenini saklar", () => {
  const result = salesStore.addOffer({
    customerId: salesStore.customers.find((item) => !item.archived).id,
    title: "Yeni MVP Teklifi",
    numericAmount: 450000,
    validUntil: "2026-09-15",
    probability: 55,
    ownerId: 2,
  });
  assert.equal(result.ok, true);
  salesStore.updateOffer(result.offer.id, {
    ...result.offer,
    status: "Kazanıldı",
    probability: 100,
    outcomeReason: "Karar kriterleri karşılandı",
  });

  assert.equal(result.offer.status, "Kazanıldı");
  assert.equal(result.offer.outcomeReason, "Karar kriterleri karşılandı");
  assert.equal(result.offer.revisions.length, 1);
  assert.ok(result.offer.revisions[0].changedFields.includes("outcomeReason"));
});

test("müşteriyi veri kaybı olmadan arşivler ve yeniden aktifleştirir", () => {
  const customer = salesStore.customers.find((item) => !item.archived);
  assert.equal(salesStore.archiveCustomer(customer.id, true), true);
  assert.equal(customer.archived, true);
  assert.equal(salesStore.archiveCustomer(customer.id, false), true);
  assert.equal(customer.archived, false);
});

test("görevin başlık, tarih, öncelik ve sorumlusunu günceller", () => {
  salesStore.addTask({ customerId: 1, title: "Düzenlenecek görev", dueDate: "2026-09-01", priority: "Orta", ownerId: 2 });
  const task = salesStore.state.tasks.find((item) => item.title === "Düzenlenecek görev");
  assert.equal(salesStore.updateTask(task.id, { ...task, title: "Güncel görev", dueDate: "2026-09-05", priority: "Yüksek", ownerId: 3 }), true);
  assert.equal(task.title, "Güncel görev");
  assert.equal(task.dueDate, "2026-09-05");
  assert.equal(task.priority, "Yüksek");
  assert.equal(task.ownerId, 3);
});

test("ilişkisiz lead müşteriye dönüştü yapılamaz ve uygun değil nedeni zorunludur", () => {
  const lead = salesStore.addLead({ name: "Akış Kontrol", company: "Akış", phone: `0533 777 ${String(Date.now()).slice(-2)} 77`, source: "Manuel" });
  assert.equal(salesStore.updateLeadStatus(lead.id, "Müşteriye dönüştü"), false);
  assert.equal(salesStore.updateLead(lead.id, { ...lead, status: "Uygun değil", disqualificationReason: "" }), false);
  assert.equal(salesStore.updateLead(lead.id, { ...lead, status: "Uygun değil", disqualificationReason: "Bütçe uygun değil" }), true);
  assert.equal(lead.disqualificationReason, "Bütçe uygun değil");
});

test("kapanmış, iptal ve arşiv tekliflerini açık pipeline dışında tutar", () => {
  const customerId = salesStore.customers.find((item) => !item.archived).id;
  const open = salesStore.addOffer({ customerId, title: "Pipeline açık", numericAmount: 100000, validUntil: "2026-10-01", probability: 50 }).offer;
  const won = salesStore.addOffer({ customerId, title: "Pipeline kazanıldı", numericAmount: 200000, validUntil: "2026-10-01", probability: 100 }).offer;
  salesStore.updateOffer(won.id, { ...won, status: "Kazanıldı", outcomeReason: "Başarılı demo" });
  const cancelled = salesStore.addOffer({ customerId, title: "Pipeline iptal", numericAmount: 300000, validUntil: "2026-10-01", probability: 60 }).offer;
  salesStore.cancelOffer(cancelled.id, "Müşteri talebi");
  const archived = salesStore.addOffer({ customerId, title: "Pipeline arşiv", numericAmount: 400000, validUntil: "2026-10-01", probability: 70 }).offer;
  salesStore.archiveOffer(archived.id, true);

  assert.ok(salesStore.activeOffers.value.some((item) => item.id === open.id));
  assert.ok(!salesStore.activeOffers.value.some((item) => [won.id, cancelled.id, archived.id].includes(item.id)));
});

test("müşteri aktivitesi son temas tarihini otomatik günceller", () => {
  const customer = salesStore.customers.find((item) => !item.archived);
  customer.lastContactDate = "2020-01-01";
  salesStore.addActivity("customer", customer.id, "Temas testi", "Son temas güncellenmeli");
  assert.equal(customer.lastContactDate, new Date().toISOString().slice(0, 10));
});
