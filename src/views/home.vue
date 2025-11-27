<template>
  <div class="home-page">
    <nav class="navbar">
      <div class="nav-content">
        <div class="nav-left" @click="goToHome" style="cursor: pointer;">
  <img 
    src="../assets/logo.png" 
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
          <button @click="handleLogout" class="btn-logout">Cerrar Sesión</button>
        </div>
      </div>
    </nav>

    <div class="container">
      <div class="welcome-section">
        <h1>BIENVENIDO 👋</h1>
        <p v-if="user">
          Hola, <strong>{{ user.email }}</strong>! Has iniciado sesión correctamente.
        </p>
      </div>


      <div class="cards-grid">
  <div class="card" @click="goToDashboard">
    <div class="card-icon">
      <img src="../assets/paciente.png" alt="Icono de Pacientes" class="card-image" />
    </div>
    <h3>Pacientes</h3>
    <p>Gestionar información de pacientes</p>
  </div>

  <div class="card" @click="goToIa">
    <div class="card-icon">
      <img src="../assets/ia.png" alt="Icono de IA" class="card-image" />
    </div>
    <h3>Preguntale a la IA</h3>
    <p>Asistente Inteligente</p> </div>
</div>

      <div class="info-section" v-if="user">
        <h3>Información de tu cuenta</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>📧Email:</strong>
            <span>{{ user.email }}</span>
          </div>
          <div class="info-item">
            <strong>👤ID de usuario:</strong>
            <span>{{ user.id }}</span>
          </div>
          <div class="info-item">
            <strong>🛜Última conexión:</strong>
            <span>{{ formatDate(user.last_sign_in_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';

export default {
  name: "Home",
  setup() {
    const router = useRouter();
    const user = ref(null);

    const userInitial = computed(() => {
      return user.value?.email ? user.value.email[0].toUpperCase() : '?';
    });

    onMounted(async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user.value = currentUser;
    });

    const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/');
    };

    const goToDashboard = () => {
      router.push('/dashboard');
    };
    const goToIa = () => {
      router.push('/ia');
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return {
      user,
      userInitial,
      handleLogout,
        goToIa,
      goToDashboard,
      formatDate
    };
  }
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.navbar {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.nav-left h2 {
  color: #221a21;
  margin: 0;
  font-size: 15px;
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
}

.user-name {
  font-weight: 600;
  color: #333;
}

.btn-logout {
  padding: 10px 20px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-logout:hover {
  background: #ee5a6f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-section h1 {
  font-size: 36px;
  color: #b2146a;
  margin-bottom: 1rem;
}

.welcome-section p {
  font-size: 18px;
  color: #666;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-icon {
  margin-bottom: 15px; /* Espacio entre el icono y el título */
  display: flex; /* Para centrar la imagen */
  justify-content: center; /* Centrar horizontalmente */
  align-items: center; /* Centrar verticalmente */
  height: 80px; /* Define una altura fija para el contenedor del icono */
  width: 100%; /* Opcional: Ancho completo para el contenedor */
}

.card-image {
  max-width: 70px; /* Ajusta el tamaño máximo de las imágenes */
  height: auto;
  display: block; /* Para que margin auto funcione */
}

.card h3 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 20px;
}

.card p {
  color: #666;
  font-size: 14px;
}

.info-section {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.info-section h3 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 22px;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: #f5f7fa;
  border-radius: 8px;
}

.info-item strong {
  color: #b2146a;
}

@media (max-width: 768px) {
  .nav-content {
    flex-direction: column;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .info-item {
    flex-direction: column;
    gap: 0.5rem;
  }

  .user-name {
    display: none;
  }
}
</style>