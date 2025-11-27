<template>
  <div class="page">
    <div class="card">
      <div class="logo">
  <img src="../assets/logo.png" alt="Logo Centro de Salud Chincha Baja" class="logo-image" />
</div>
      
      <h1>Centro de Salud</h1>
      <h2>Chincha Baja</h2>
      <p>Sistema de Gestión de Pacientes</p>

      <!-- Formulario de Login -->
      <form @submit.prevent="handleSubmit" class="form">
        <div class="form-group">
          <label> Email</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="tu@email.com"
            required 
          />
        </div>

        <div class="form-group">
          <label> Contraseña</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••"
            required 
            minlength="6"
          />
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading" class="spinner-small"></span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </form>

      <!-- Mensajes -->
      <div v-if="error" class="message error">
        ❌ {{ error }}
      </div>
      <div v-if="success" class="message success">
        ✅ {{ success }}
      </div>


    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';

export default {
  name: "LoginRegister",
  setup() {
    const router = useRouter();
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const error = ref('');
    const success = ref('');

    const handleSubmit = async () => {
      error.value = '';
      success.value = '';
      loading.value = true;

      try {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value,
        });

        if (loginError) throw loginError;

        success.value = 'Inicio de sesión exitoso';
        setTimeout(() => router.push('home'), 800);
      } catch (e) {
        error.value = e.message || 'Credenciales incorrectas';
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      password,
      loading,
      error,
      success,
      handleSubmit
    };
  }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fefeff 0%, #f582f1 100%);
  padding: 20px;
}

.card {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 100%;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo {
  text-align: center;
  margin-bottom: 1rem;
}

.icon {
  font-size: 3.5rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 5px;
  text-align: center;
  font-weight: 700;
}

h2 {
  font-size: 22px;
  color: #c80bbc;
  margin-bottom: 10px;
  text-align: center;
  font-weight: 600;
}

p {
  color: #666;
  margin-bottom: 25px;
  font-size: 14px;
  text-align: center;
}

.form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-submit {
  width: 100%;
  padding: 14px;
  background: #bd299f;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-submit:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.message {
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 15px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.message.error {
  background: #fee;
  color: #c33;
  border: 1px solid #fcc;
}

.message.success {
  background: #efe;
  color: #3c3;
  border: 1px solid #cfc;
}

.footer-text {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  color: #999;
  font-size: 13px;
  text-align: center;
}
</style>