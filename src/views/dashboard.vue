<template>
  <div class="dashboard-page">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="nav-content">
<div class="nav-left" @click="goToHome" style="cursor: pointer;">
  <img 
    src=  "../assets/logo.png" 
    alt="Logo Centro de Salud" 
    class="nav-logo"
  />
  
  <h2 class="nav-title">
    Centro de Salud Chincha Baja
  </h2>
</div>
        <div class="nav-right">
          <div class="user-info" v-if="user">
            <div class="user-avatar">{{ userInitial }}</div>
            <span class="user-name">{{ user.email }}</span>
          </div>
          <button @click="handleLogout" class="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>

    <!-- Contenido Principal -->
    <div class="container">
      <!-- Header con estadísticas -->
      <div class="stats-header">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <p class="stat-label">Total Pacientes</p>
            <h3 class="stat-value">{{ stats.total }}</h3>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👨</div>
          <div class="stat-info">
            <p class="stat-label">Hombres</p>
            <h3 class="stat-value">{{ stats.hombres }}</h3>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👩</div>
          <div class="stat-info">
            <p class="stat-label">Mujeres</p>
            <h3 class="stat-value">{{ stats.mujeres }}</h3>
          </div>
        </div>
      </div>

      <!-- Barra de búsqueda y botón nuevo -->
      <div class="search-section">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por HC, DNI, apellidos o nombres..."
            @input="handleSearch"
            class="search-input"
          />
          <button v-if="searchQuery" @click="clearSearch" class="btn-clear">
            ✕
          </button>
        </div>
        <button @click="openCreateModal" class="btn-new-patient">
          ➕ Nuevo Paciente
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando pacientes...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <!-- Tabla de pacientes SIMPLIFICADA -->
      <div v-else class="table-container">
        <table class="pacientes-table">
          <thead>
            <tr>
              <th>HC</th>
              <th>DNI</th>
              <th>Apellidos y Nombres</th>
              <th>Edad</th>
              <th>Sexo</th>
              <th>Teléfono</th>
              <th>Seguro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="paciente in paginatedPacientes" :key="paciente.id">
              <td>
                <strong class="hc-number">{{ paciente.hc || 'S/N' }}</strong>
              </td>
              <td>
                <div class="dni-cell">
                  <span :class="['badge-documento', paciente.tipo_documento || 'DNI']">
                    {{ (paciente.tipo_documento === 'CE') ? 'CE' : 'DNI' }}
                  </span>
                  <strong>{{ paciente.dni }}</strong>
                </div>
              </td>
              <td class="nombre-completo">
                <div class="nombre-cell">
                  <strong>{{ paciente.apellidos }}</strong>
                  <span>{{ paciente.nombres }}</span>
                </div>
              </td>
              <td>
                <span class="edad-badge">{{ calcularEdad(paciente.fecha_nacimiento) }} años</span>
              </td>
              <td>
                <span :class="['badge-sexo', paciente.sexo]">
                  {{ paciente.sexo === 'M' ? '👨 M' : '👩 F' }}
                </span>
              </td>
              <td>{{ paciente.telefono || 'N/A' }}</td>
              <td>
                <span :class="['badge-seguro', paciente.tipo_de_seguro]">
                  {{ paciente.tipo_de_seguro || 'N/A' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="viewPaciente(paciente)" class="btn-action btn-view" title="Ver detalles">
                    👁️
                  </button>
                  <button @click="openEditModal(paciente)" class="btn-action btn-edit" title="Editar">
                    ✏️
                  </button>
                  <button @click="confirmDelete(paciente)" class="btn-action btn-delete" title="Eliminar">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Si no hay resultados -->
        <div v-if="pacientes.length === 0" class="no-results">
          <p>😔 No se encontraron pacientes</p>
        </div>
      </div>

      <!-- Paginación -->
      <div v-if="pacientes.length > 0" class="pagination">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1"
          class="btn-page"
        >
          ← Anterior
        </button>
        
        <span class="page-info">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="btn-page"
        >
          Siguiente →
        </button>
      </div>
    </div>

    <!-- Modal para Ver Detalles -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>👤 Detalles del Paciente</h2>
          <button @click="closeViewModal" class="btn-close">✕</button>
        </div>
        <div class="modal-body" v-if="selectedPaciente">
          <div class="detail-grid">
            <div class="detail-item">
              <strong>Historia Clínica (HC):</strong>
              <span class="highlight-text">{{ selectedPaciente.hc || 'Sin asignar' }}</span>
            </div>
            <div class="detail-item">
              <strong>Tipo de Documento:</strong>
              <span :class="['badge-documento', selectedPaciente.tipo_documento || 'DNI']">
                {{ (selectedPaciente.tipo_documento === 'CE') ? '🛂 Carnet de Extranjería' : '🆔 DNI' }}
              </span>
            </div>
            <div class="detail-item">
              <strong>DNI/Carnet:</strong>
              <span>{{ selectedPaciente.dni }}</span>
            </div>
            <div class="detail-item">
              <strong>Apellidos:</strong>
              <span>{{ selectedPaciente.apellidos }}</span>
            </div>
            <div class="detail-item">
              <strong>Nombres:</strong>
              <span>{{ selectedPaciente.nombres }}</span>
            </div>
            <div class="detail-item">
              <strong>Sexo:</strong>
              <span>{{ selectedPaciente.sexo === 'M' ? 'Masculino' : 'Femenino' }}</span>
            </div>
            <div class="detail-item">
              <strong>Edad:</strong>
              <span>{{ calcularEdad(selectedPaciente.fecha_nacimiento) }} años</span>
            </div>
            <div class="detail-item">
              <strong>Fecha de Nacimiento:</strong>
              <span>{{ formatDate(selectedPaciente.fecha_nacimiento) }}</span>
            </div>
            <div class="detail-item">
              <strong>Domicilio:</strong>
              <span>{{ selectedPaciente.domicilio_actual || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <strong>Lugar:</strong>
              <span>{{ selectedPaciente.lugar || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <strong>Teléfono:</strong>
              <span>{{ selectedPaciente.telefono || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <strong>Tipo de Seguro:</strong>
              <span :class="['badge-seguro', selectedPaciente.tipo_de_seguro]">
                {{ selectedPaciente.tipo_de_seguro || 'N/A' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Crear/Editar -->
    <div v-if="showFormModal" class="modal-overlay" @click="closeFormModal">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditMode ? '✏️ Editar Paciente' : '➕ Nuevo Paciente' }}</h2>
          <button @click="closeFormModal" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitForm" class="patient-form">
            <!-- Tipo de Documento -->
            <div class="form-section">
              <h3 class="section-title">📄 Identificación</h3>
              
              <div class="form-group">
                <label>Tipo de Documento *</label>
                <div class="radio-group radio-group-horizontal">
                  <label class="radio-option">
                    <input type="radio" v-model="formData.tipo_documento" value="DNI" />
                    <span class="radio-label">🆔 DNI (Peruano)</span>
                  </label>
                  <label class="radio-option">
                    <input type="radio" v-model="formData.tipo_documento" value="CE" />
                    <span class="radio-label">🛂 Carnet de Extranjería</span>
                  </label>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>{{ formData.tipo_documento === 'CE' ? 'Carnet de Extranjería' : 'DNI' }} *</label>
                  <input 
                    v-model="formData.dni" 
                    type="text" 
                    required 
                    maxlength="20" 
                    :placeholder="formData.tipo_documento === 'DNI' ? 'Ej: 12345678' : 'Ej: 001234567'"
                  />
                </div>
                <div class="form-group">
                  <label>Historia Clínica (HC) *</label>
                  <input v-model="formData.hc" type="text" required maxlength="50" placeholder="Ej: HC-001" />
                </div>
              </div>
            </div>

            <!-- Datos Personales -->
            <div class="form-section">
              <h3 class="section-title">👤 Datos Personales</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Apellidos *</label>
                  <input v-model="formData.apellidos" type="text" required placeholder="Apellido Paterno Materno" />
                </div>
                <div class="form-group">
                  <label>Nombres *</label>
                  <input v-model="formData.nombres" type="text" required placeholder="Nombres completos" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Sexo *</label>
                  <select v-model="formData.sexo" required>
                    <option value="">Seleccionar...</option>
                    <option value="M">👨 Masculino</option>
                    <option value="F">👩 Femenino</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Fecha de Nacimiento *</label>
                  <input v-model="formData.fecha_nacimiento" type="date" required />
                </div>
              </div>
            </div>

            <!-- Datos de Contacto -->
            <div class="form-section">
              <h3 class="section-title">📍 Datos de Contacto</h3>
              
              <div class="form-group">
                <label>Domicilio Actual</label>
                <input v-model="formData.domicilio_actual" type="text" placeholder="Dirección completa" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Lugar</label>
                  <input v-model="formData.lugar" type="text" placeholder="Distrito, Provincia" />
                </div>
                <div class="form-group">
                  <label>Teléfono</label>
                  <input v-model="formData.telefono" type="text" maxlength="20" placeholder="999 999 999" />
                </div>
              </div>
            </div>

            <!-- Datos de Seguro -->
            <div class="form-section">
              <h3 class="section-title">🏥 Información de Seguro</h3>
              
              <div class="form-group">
                <label>Tipo de Seguro *</label>
                <select v-model="formData.tipo_de_seguro" required>
                  <option value="">Seleccionar...</option>
                  <option value="SIS">✅ SIS</option>
                  <option value="Sin SIS">❌ Sin SIS</option>
                  <option value="EsSalud">🏥 EsSalud</option>
                  <option value="Particular">💳 Particular</option>
                  <option value="Otro">📋 Otro</option>
                </select>
              </div>
            </div>

            <div v-if="formError" class="form-error">
              ❌ {{ formError }}
            </div>

            <div class="form-actions">
              <button type="button" @click="closeFormModal" class="btn-cancel">
                Cancelar
              </button>
              <button type="submit" class="btn-submit" :disabled="formLoading">
                <span v-if="formLoading" class="spinner-small"></span>
                <span v-else>{{ isEditMode ? '💾 Actualizar' : '✨ Crear Paciente' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content modal-small" @click.stop>
        <div class="modal-header">
          <h2>🗑️ Confirmar Eliminación</h2>
          <button @click="closeDeleteModal" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <p>¿Estás seguro de que deseas eliminar este paciente?</p>
          <div v-if="selectedPaciente" class="delete-info">
            <strong>{{ selectedPaciente.nombres }} {{ selectedPaciente.apellidos }}</strong>
            <p>HC: {{ selectedPaciente.hc || 'S/N' }}</p>
            <p>DNI: {{ selectedPaciente.dni }}</p>
          </div>
          <div class="form-actions">
            <button @click="closeDeleteModal" class="btn-cancel">
              Cancelar
            </button>
            <button @click="deletePacienteConfirmed" class="btn-delete-confirm" :disabled="formLoading">
              <span v-if="formLoading" class="spinner-small"></span>
              <span v-else>🗑️ Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  supabase, 
  getPacientes, 
  searchPacientes, 
  getEstadisticas,
  createPaciente,
  updatePaciente,
  deletePaciente
} from '../supabase';

export default {
  name: "Dashboard",
  setup() {
    const router = useRouter();
    const user = ref(null);
    const pacientes = ref([]);
    const loading = ref(true);
    const error = ref('');
    const searchQuery = ref('');
    const stats = ref({ total: 0, hombres: 0, mujeres: 0 });
    
    // Paginación
    const currentPage = ref(1);
    const itemsPerPage = 10;

    // Modales
    const showViewModal = ref(false);
    const showFormModal = ref(false);
    const showDeleteModal = ref(false);
    const selectedPaciente = ref(null);
    const isEditMode = ref(false);
    const formLoading = ref(false);
    const formError = ref('');

    // Formulario
    const formData = ref({
      dni: '',
      hc: '',
      apellidos: '',
      nombres: '',
      sexo: '',
      fecha_nacimiento: '',
      domicilio_actual: '',
      lugar: '',
      telefono: '',
      tipo_de_seguro: '',
      tipo_documento: 'DNI'
    });

    const userInitial = computed(() => {
      return user.value?.email ? user.value.email[0].toUpperCase() : '?';
    });

    const paginatedPacientes = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return pacientes.value.slice(start, end);
    });

    const totalPages = computed(() => {
      return Math.ceil(pacientes.value.length / itemsPerPage);
    });

    // Ir a Home
    const goToHome = () => {
      router.push('/home');
    };

    // Calcular edad
    const calcularEdad = (fechaNacimiento) => {
      if (!fechaNacimiento) return 'N/A';
      const hoy = new Date();
      const nacimiento = new Date(fechaNacimiento);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    };

    // Cargar datos
    const loadPacientes = async () => {
      try {
        loading.value = true;
        error.value = '';
        
        const data = await getPacientes();
        pacientes.value = data;
        
        const statsData = await getEstadisticas();
        stats.value = statsData;
        
      } catch (e) {
        error.value = 'Error al cargar los pacientes: ' + e.message;
        console.error(e);
      } finally {
        loading.value = false;
      }
    };

    // Buscar
    let searchTimeout;
    const handleSearch = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        if (!searchQuery.value.trim()) {
          await loadPacientes();
          return;
        }

        try {
          loading.value = true;
          const results = await searchPacientes(searchQuery.value);
          pacientes.value = results;
          currentPage.value = 1;
        } catch (e) {
          error.value = 'Error en la búsqueda: ' + e.message;
        } finally {
          loading.value = false;
        }
      }, 300);
    };

    const clearSearch = async () => {
      searchQuery.value = '';
      currentPage.value = 1;
      await loadPacientes();
    };

    // Ver paciente
    const viewPaciente = (paciente) => {
      selectedPaciente.value = paciente;
      showViewModal.value = true;
    };

    const closeViewModal = () => {
      showViewModal.value = false;
      selectedPaciente.value = null;
    };

    // Crear paciente
    const openCreateModal = () => {
      isEditMode.value = false;
      formData.value = {
        dni: '',
        hc: '',
        apellidos: '',
        nombres: '',
        sexo: '',
        fecha_nacimiento: '',
        domicilio_actual: '',
        lugar: '',
        telefono: '',
        tipo_de_seguro: '',
        tipo_documento: 'DNI'
      };
      formError.value = '';
      showFormModal.value = true;
    };

    // Editar paciente
    const openEditModal = (paciente) => {
      isEditMode.value = true;
      selectedPaciente.value = paciente;
      formData.value = {
        dni: paciente.dni || '',
        hc: paciente.hc || '',
        apellidos: paciente.apellidos || '',
        nombres: paciente.nombres || '',
        sexo: paciente.sexo || '',
        fecha_nacimiento: paciente.fecha_nacimiento || '',
        domicilio_actual: paciente.domicilio_actual || '',
        lugar: paciente.lugar || '',
        telefono: paciente.telefono || '',
        tipo_de_seguro: paciente.tipo_de_seguro || '',
        tipo_documento: paciente.tipo_documento || 'DNI'
      };
      formError.value = '';
      showFormModal.value = true;
    };

    const closeFormModal = () => {
      showFormModal.value = false;
      selectedPaciente.value = null;
      isEditMode.value = false;
      formError.value = '';
    };

    // Enviar formulario
    const submitForm = async () => {
      try {
        formLoading.value = true;
        formError.value = '';

        if (isEditMode.value) {
          await updatePaciente(selectedPaciente.value.id, formData.value);
          alert('✅ Paciente actualizado correctamente');
        } else {
          await createPaciente(formData.value);
          alert('✅ Paciente creado correctamente');
        }

        closeFormModal();
        await loadPacientes();
      } catch (e) {
        formError.value = e.message || 'Error al guardar el paciente';
        console.error(e);
      } finally {
        formLoading.value = false;
      }
    };

    // Eliminar paciente
    const confirmDelete = (paciente) => {
      selectedPaciente.value = paciente;
      showDeleteModal.value = true;
    };

    const closeDeleteModal = () => {
      showDeleteModal.value = false;
      selectedPaciente.value = null;
    };

    const deletePacienteConfirmed = async () => {
      try {
        formLoading.value = true;
        await deletePaciente(selectedPaciente.value.id);
        alert('✅ Paciente eliminado correctamente');
        closeDeleteModal();
        await loadPacientes();
      } catch (e) {
        alert('❌ Error al eliminar el paciente: ' + e.message);
        console.error(e);
      } finally {
        formLoading.value = false;
      }
    };

    // Paginación
    const prevPage = () => {
      if (currentPage.value > 1) currentPage.value--;
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) currentPage.value++;
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/');
    };

    onMounted(async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user.value = currentUser;
      await loadPacientes();
    });

    return {
      user,
      userInitial,
      pacientes,
      loading,
      error,
      searchQuery,
      paginatedPacientes,
      currentPage,
      totalPages,
      stats,
      showViewModal,
      showFormModal,
      showDeleteModal,
      selectedPaciente,
      isEditMode,
      formData,
      formLoading,
      formError,
      goToHome,
      handleLogout,
      handleSearch,
      clearSearch,
      prevPage,
      nextPage,
      formatDate,
      calcularEdad,
      viewPaciente,
      closeViewModal,
      openCreateModal,
      openEditModal,
      closeFormModal,
      submitForm,
      confirmDelete,
      closeDeleteModal,
      deletePacienteConfirmed
    };
  }
};
</script>
<style>
/* ===========================
   ESTILOS GENERALES
   =========================== */
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* ===========================
   NAVBAR
   =========================== */
.navbar {
  background: white;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.nav-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

/* Asumiendo que .nav-left está dentro de un contenedor de navegación */
.nav-left {
  display: flex; /* Para alinear el logo y el texto */
  align-items: center;
  gap: 10px; /* Espacio entre el logo y el texto */
  cursor: pointer; /* Indica que es clickeable */
}

.nav-logo {
  height: 40px; /* Tamaño del logo en la barra de navegación */
  width: auto;
}

.nav-title {
  /* Estilos para el texto */
  font-size: 18px; 
  color: #333; /* O el color que uses para tu texto principal */
  margin: 0; /* Remover margen por defecto de h2 */
}

/* NUEVO: Título clickeable */
.nav-title {
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-title:hover {
  color: #764ba2;
  transform: scale(1.02);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #b2146a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.user-name {
  font-weight: 600;
  color: #333;
}

.btn-logout {
  padding: 10px 20px;
  background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(255, 71, 87, 0.3);
}

.btn-logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 71, 87, 0.4);
}

/* ===========================
   CONTAINER Y STATS
   =========================== */
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.stats-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin: 0 0 0.5rem 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

/* ===========================
   BÚSQUEDA
   =========================== */
.search-section {
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-bar {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 300px;
}

.search-icon {
  font-size: 20px;
}

.search-input {
  flex: 1;
  border: none;
  font-size: 16px;
  outline: none;
}

.btn-clear {
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-clear:hover {
  background: #ee5a6f;
  transform: rotate(90deg);
}

.btn-new-patient {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #b2146a 0%, #b2146a 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.btn-new-patient:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(38, 222, 129, 0.4);
}

/* ===========================
   LOADING Y ERRORES
   =========================== */
.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
}

/* ===========================
   TABLA SIMPLIFICADA
   =========================== */
.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.pacientes-table {
  width: 100%;
  border-collapse: collapse;
}

.pacientes-table thead {
  background: linear-gradient(135deg, #667eea 0%, #b2146a 100%);
  color: white;
}

.pacientes-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
  font-size: 14px;
}

.pacientes-table td {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.pacientes-table tbody tr {
  transition: all 0.2s ease;
}

.pacientes-table tbody tr:hover {
  background: #f8f9fa;
  transform: scale(1.005);
}

/* NUEVO: Estilos para HC */
.hc-number {
  color: #667eea;
  font-size: 15px;
  font-weight: 700;
  background: #e3f2fd;
  padding: 6px 12px;
  border-radius: 8px;
  display: inline-block;
}

/* NUEVO: Celda de DNI */
.dni-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* NUEVO: Nombres completos */
.nombre-completo {
  max-width: 300px;
}

.nombre-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nombre-cell strong {
  color: #333;
  font-size: 14px;
}

.nombre-cell span {
  color: #666;
  font-size: 13px;
}

/* NUEVO: Botones de acción en fila */
.action-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 18px;
}

/* ===========================
   BADGES
   =========================== */
.edad-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-sexo {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-sexo.M {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-sexo.F {
  background: #fce4ec;
  color: #c2185b;
}

.badge-documento {
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
}

.badge-documento.DNI {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-documento.CE {
  background: #fff3e0;
  color: #f57c00;
}

.badge-seguro {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
}

.badge-seguro[class*="SIS"]:not([class*="Sin"]) {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge-seguro[class*="Sin"] {
  background: #ffebee;
  color: #c62828;
}

.badge-seguro[class*="EsSalud"] {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-seguro[class*="Particular"] {
  background: #fff3e0;
  color: #f57c00;
}

.badge-seguro[class*="Otro"] {
  background: #f3e5f5;
  color: #7b1fa2;
}

/* ===========================
   BOTONES DE ACCIÓN
   =========================== */
.btn-action {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.btn-view {
  background: #e3f2fd;
}

.btn-view:hover {
  background: #bbdefb;
  transform: scale(1.1);
}

.btn-edit {
  background: #fff3e0;
}

.btn-edit:hover {
  background: #ffe0b2;
  transform: scale(1.1);
}

.btn-delete {
  background: #ffebee;
}

.btn-delete:hover {
  background: #ffcdd2;
  transform: scale(1.1);
}

/* ===========================
   PAGINACIÓN
   =========================== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.btn-page {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-page:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
}

.btn-page:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.page-info {
  font-weight: 600;
  color: #333;
}

/* ===========================
   MODALES
   =========================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

.modal-large {
  max-width: 900px;
}

.modal-small {
  max-width: 400px;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 20px 20px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 700;
}

.btn-close {
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: #ee5a6f;
  transform: rotate(90deg) scale(1.1);
}

.modal-body {
  padding: 2rem;
}

/* ===========================
   DETALLES DEL PACIENTE
   =========================== */
.detail-grid {
  display: grid;
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.detail-item strong {
  color: #667eea;
  font-weight: 600;
}

.highlight-text {
  background: #e3f2fd;
  color: #1976d2;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
}

/* ===========================
   FORMULARIO
   =========================== */
.patient-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #e9ecef;
}

.section-title {
  margin: 0 0 1.5rem 0;
  color: #667eea;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* ===========================
   RADIO BUTTONS
   =========================== */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-group-horizontal {
  flex-direction: row;
  gap: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
}

.radio-option:hover {
  background: #e3f2fd;
  border-color: #667eea;
}

.radio-option input[type="radio"] {
  margin-right: 0.75rem;
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #667eea;
}

.radio-option input[type="radio"]:checked ~ .radio-label {
  color: #667eea;
  font-weight: 700;
}

.radio-option:has(input[type="radio"]:checked) {
  background: #e3f2fd;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.radio-label {
  font-size: 15px;
  color: #333;
  transition: all 0.3s ease;
}

/* ===========================
   BOTONES DEL FORMULARIO
   =========================== */
.form-error {
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #d0d0d0;
  transform: translateY(-2px);
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-delete-confirm {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
}

.btn-delete-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.4);
}

.btn-delete-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===========================
   MODAL ELIMINAR
   =========================== */
.delete-info {
  background: #fff3e0;
  padding: 1rem;
  border-radius: 10px;
  margin: 1rem 0;
  border-left: 4px solid #ff4757;
}

.delete-info strong {
  display: block;
  color: #ff4757;
  font-size: 18px;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.delete-info p {
  margin: 0.25rem 0;
  color: #666;
}

/* ===========================
   RESPONSIVE
   =========================== */
@media (max-width: 768px) {
  .nav-content {
    flex-direction: column;
  }
  
  .user-name {
    display: none;
  }
  
  .stats-header {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .search-section {
    flex-direction: column;
  }
  
  .search-bar {
    min-width: 100%;
  }
  
  .table-container {
    overflow-x: scroll;
  }
  
  .pacientes-table {
    font-size: 12px;
  }

  .pacientes-table th,
  .pacientes-table td {
    padding: 0.75rem 0.5rem;
  }
  
  .nombre-completo {
    max-width: 200px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .radio-group-horizontal {
    flex-direction: column;
  }
  
  .modal-content {
    margin: 1rem;
  }
  
  .modal-large {
    max-width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>