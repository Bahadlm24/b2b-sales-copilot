<script setup>
import { computed, reactive, ref } from "vue";
import { permissionCatalog } from "../services/authorization";
import { TOKEN_LIFETIME_MS } from "../services/tokenService";
import { salesStore } from "../stores/salesStore";

const selectedUserId = ref(salesStore.state.users[0]?.id);
const departmentName = ref("");
const roleName = ref("");
const selectedRoleKey = ref(salesStore.state.roleDefinitions[0]?.key);
const teamForm = reactive({ name: "", departmentId: salesStore.state.departments[0]?.id || "" });
const organizationFeedback = ref("");
const selectedUser = computed(() => salesStore.state.users.find((user) => user.id === Number(selectedUserId.value)));
const selectedRole = computed(() => salesStore.state.roleDefinitions.find((role) => role.key === selectedRoleKey.value));
const tokenExpiresAt = computed(() => salesStore.state.tokenSession?.expiresAt
  ? new Date(salesStore.state.tokenSession.expiresAt).toLocaleString("tr-TR")
  : "Aktif token yok");
const syncLastRun = computed(() => salesStore.state.syncSettings.lastSyncAt
  ? new Date(salesStore.state.syncSettings.lastSyncAt).toLocaleString("tr-TR")
  : "Henüz çalışmadı");
const syncNextRun = computed(() => new Date(salesStore.state.syncSettings.nextSyncAt).toLocaleString("tr-TR"));

function addDepartment() {
  const ok = salesStore.addDepartment(departmentName.value);
  organizationFeedback.value = ok ? "Departman eklendi." : "Departman eklenemedi veya zaten mevcut.";
  if (ok) departmentName.value = "";
}

function addTeam() {
  const ok = salesStore.addTeam(teamForm.name, teamForm.departmentId);
  organizationFeedback.value = ok ? "Takım eklendi." : "Takım adı ve departman zorunludur.";
  if (ok) teamForm.name = "";
}

function addRole() {
  const ok = salesStore.addRole(roleName.value);
  organizationFeedback.value = ok ? "Yeni rol eklendi." : "Rol eklenemedi veya zaten mevcut.";
  if (ok) {
    selectedRoleKey.value = salesStore.state.roleDefinitions.at(-1).key;
    roleName.value = "";
  }
}

function removeSelectedRole() {
  if (!selectedRole.value) return;
  const ok = salesStore.removeRole(selectedRole.value.key);
  organizationFeedback.value = ok ? "Rol silindi." : "Kullanıcıya atanmış rol silinemez.";
  if (ok) selectedRoleKey.value = salesStore.state.roleDefinitions[0]?.key;
}
</script>

<template>
  <section class="settings-grid">
    <article class="panel settings-wide">
      <div class="panel-header"><div><p class="eyebrow">DİNAMİK YETKİLER</p><h3>Kişi bazlı sayfa erişimi</h3></div><select v-model="selectedUserId" class="select-input user-permission-select"><option v-for="user in salesStore.state.users" :key="user.id" :value="user.id">{{ user.name }}</option></select></div>
      <p class="settings-description">Değişiklikler anında uygulanır ve tarayıcıda saklanır. İşaret kaldırıldığında kullanıcı ilgili menüyü ve rotayı kullanamaz.</p>
      <div v-if="selectedUser" class="permission-grid">
        <label v-for="permission in permissionCatalog" :key="permission.key" class="permission-item">
          <input type="checkbox" :checked="selectedUser.permissions.includes(permission.key)" @change="salesStore.toggleUserPermission(selectedUser.id, permission.key)" />
          <span><strong>{{ permission.label }}</strong><small>{{ permission.key }}</small></span>
        </label>
      </div>
    </article>

    <article class="panel settings-wide">
      <div class="panel-header"><div><p class="eyebrow">DİNAMİK ROLLER</p><h3>Rol tanımları ve başlangıç izinleri</h3></div><div class="role-actions"><select v-model="selectedRoleKey" class="select-input user-permission-select"><option v-for="role in salesStore.state.roleDefinitions" :key="role.key" :value="role.key">{{ role.label }}</option></select><button class="remove-role-button" :disabled="!selectedRole" @click="removeSelectedRole">Rolü sil</button></div></div>
      <form class="inline-add-form role-add-form" @submit.prevent="addRole"><input v-model="roleName" class="search-input" placeholder="Yeni rol adı" required /><button class="primary-button compact" type="submit">Rol ekle</button></form>
      <p class="settings-description">Rol izinleri yeni kullanıcıların başlangıç erişimini belirler. Mevcut kişilerin özel izinleri üst bölümden ayrıca yönetilir.</p>
      <div v-if="selectedRole" class="permission-grid">
        <label v-for="permission in permissionCatalog" :key="permission.key" class="permission-item">
          <input type="checkbox" :checked="selectedRole.permissions.includes(permission.key)" @change="salesStore.toggleRolePermission(selectedRole.key, permission.key)" />
          <span><strong>{{ permission.label }}</strong><small>{{ permission.key }}</small></span>
        </label>
      </div>
    </article>

    <article class="panel">
      <p class="eyebrow">DEPARTMANLAR</p><h3>Organizasyon birimleri</h3>
      <form class="inline-add-form" @submit.prevent="addDepartment"><input v-model="departmentName" class="search-input" placeholder="Departman adı" required /><button class="primary-button compact" type="submit">Ekle</button></form>
      <div class="settings-list">
        <div v-for="department in salesStore.state.departments" :key="department.id"><span>{{ department.name }}</span><button class="remove-button" aria-label="Departmanı sil" @click="organizationFeedback = salesStore.removeDepartment(department.id) ? 'Departman silindi.' : 'Atanmış departman silinemez.'">×</button></div>
      </div>
    </article>

    <article class="panel">
      <p class="eyebrow">TAKIMLAR</p><h3>Departman takımları</h3>
      <form class="task-form compact-form" @submit.prevent="addTeam">
        <input v-model="teamForm.name" class="search-input" placeholder="Takım adı" required />
        <select v-model="teamForm.departmentId" class="select-input" required><option v-for="department in salesStore.state.departments" :key="department.id" :value="department.id">{{ department.name }}</option></select>
        <button class="primary-button" type="submit">Takım ekle</button>
      </form>
      <div class="settings-list">
        <div v-for="team in salesStore.state.teams" :key="team.id"><span><strong>{{ team.name }}</strong><small>{{ salesStore.state.departments.find((item) => item.id === team.departmentId)?.name }}</small></span><button class="remove-button" aria-label="Takımı sil" @click="organizationFeedback = salesStore.removeTeam(team.id) ? 'Takım silindi.' : 'Atanmış takım silinemez.'">×</button></div>
      </div>
    </article>

    <article class="panel settings-wide token-panel">
      <div><p class="eyebrow">OTURUM TOKENI</p><h3>Servis istek güvenliği</h3><p>Token yalnızca giriş yapan kullanıcı için üretilir ve 60 dakikada bir yenilenir.</p></div>
      <dl><div><dt>Access token</dt><dd>{{ salesStore.tokenPreview() }}</dd></div><div><dt>Yenilenme zamanı</dt><dd>{{ tokenExpiresAt }}</dd></div><div><dt>Yenileme aralığı</dt><dd>{{ TOKEN_LIFETIME_MS / 60000 }} dakika</dd></div><div><dt>Yenileme sayısı</dt><dd>{{ salesStore.state.tokenSession?.refreshCount || 0 }}</dd></div></dl>
    </article>
    <article class="panel settings-wide sync-panel">
      <div><p class="eyebrow">MECRA SENKRONİZASYONU</p><h3>Otomatik veri güncelleme</h3><p>Meta, Instagram, Google Ads ve web form kaynakları belirlenen aralıkta kontrol edilir.</p></div>
      <div class="sync-controls">
        <label><span>Çalışma sıklığı</span><select :value="salesStore.state.syncSettings.frequency" class="select-input" @change="salesStore.setSyncFrequency($event.target.value)"><option value="hourly">Saatte bir</option><option value="daily">Günde bir</option></select></label>
        <label class="sync-toggle"><input type="checkbox" :checked="salesStore.state.syncSettings.enabled" @change="salesStore.toggleSync($event.target.checked)" /><span>Otomatik senkronizasyon aktif</span></label>
        <button class="secondary-button" @click="salesStore.syncExternalLeads(Date.now(), true)">Şimdi senkronize et</button>
      </div>
      <dl><div><dt>Son çalışma</dt><dd>{{ syncLastRun }}</dd></div><div><dt>Sonraki çalışma</dt><dd>{{ syncNextRun }}</dd></div><div><dt>Kaynaklar</dt><dd>{{ salesStore.state.syncSettings.sources.join(', ') }}</dd></div></dl>
    </article>
    <p v-if="organizationFeedback" class="settings-wide form-feedback settings-feedback" role="status">{{ organizationFeedback }}</p>
  </section>
</template>
