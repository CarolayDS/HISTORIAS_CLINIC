<template>
  <div class="ia-page">
    <nav class="navbar">
      <div class="nav-content">
       <div class="nav-left" @click="goHome" style="cursor: pointer;">
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

    <div class="chat-container">
      <div class="chat-header">
        <h1>🤖 Pregúntale a Gemini</h1>
        <p>
          Asistente de información del Centro de Salud. (No uses información
          sensible de pacientes)
        </p>
      </div>

      <div class="message-history" ref="messageHistoryRef">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['message', msg.sender]"
        >
          <div class="message-bubble">
            <div v-html="formatMessage(msg.text)"></div>
          </div>
        </div>
        <div v-if="loading" class="message bot loading">
          <div class="message-bubble">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <input
          v-model="currentMessage"
          @keyup.enter="sendMessage"
          type="text"
          placeholder="Escribe tu pregunta aquí..."
          :disabled="loading"
        />
        <button @click="sendMessage" :disabled="loading || !currentMessage.trim()">
          <span v-if="!loading">Enviar</span>
          <span v-else>...</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default {
  name: 'ChatbotIA',
  setup() {
    const router = useRouter();
    const user = ref(null);
    const messages = ref([
      { 
        id: 1, 
        text: '¡Hola! Soy tu asistente de IA del Centro de Salud Chincha Baja. Puedo ayudarte con información general de salud y consultar datos de pacientes por DNI, nombre o apellido. ¿En qué puedo ayudarte?', 
        sender: 'bot' 
      },
    ]);
    const currentMessage = ref('');
    const loading = ref(false);
    const messageHistoryRef = ref(null);

    const genAI = new GoogleGenerativeAI('AIzaSyA3cd0UjCTbjA99ak99j1b8z0bphxBSDn4');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const chat = ref(null);

    const userInitial = computed(() => {
      return user.value?.email ? user.value.email[0].toUpperCase() : '?';
    });

    const formatMessage = (text) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    };

    const scrollToBottom = () => {
      nextTick(() => {
        if (messageHistoryRef.value) {
          messageHistoryRef.value.scrollTop = messageHistoryRef.value.scrollHeight;
        }
      });
    };

    // Calcular edad a partir de fecha de nacimiento
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

    // ✨ BUSCAR PACIENTE POR DNI, NOMBRE O APELLIDO
    const buscarPaciente = async (criterio) => {
      try {
        console.log('🔍 Buscando paciente con:', criterio);
        
        const esNumero = /^\d+$/.test(criterio.trim());
        
        let query = supabase.from('personas_base').select('*');
        
        if (esNumero) {
          // Buscar por DNI
          query = query.eq('dni', criterio.trim());
        } else {
          // Buscar por nombres o apellidos (case-insensitive)
          query = query.or(`apellidos.ilike.%${criterio.trim()}%,nombres.ilike.%${criterio.trim()}%`);
        }

        const { data, error } = await query.limit(10); // Limitar a 10 resultados

        if (error) {
          console.error('❌ Error en la consulta:', error);
          throw error;
        }
        
        console.log('✅ Resultados encontrados:', data);
        return data;
      } catch (error) {
        console.error('❌ Error al buscar paciente:', error);
        return null;
      }
    };

    // ✨ FORMATEAR DATOS DEL PACIENTE PARA GEMINI
    const formatearDatosPaciente = (pacientes) => {
      return pacientes.map(p => {
        const edad = calcularEdad(p.fecha_nacimiento);
        return {
          'DNI': p.dni || 'N/A',
          'Historia Clínica (HC)': p.hc || 'No asignada',
          'Nombres Completos': `${p.nombres || ''} ${p.apellidos || ''}`.trim(),
          'Apellidos': p.apellidos || 'N/A',
          'Nombres': p.nombres || 'N/A',
          'Sexo': p.sexo || 'N/A',
          'Edad': `${edad} años`,
          'Fecha de Nacimiento': p.fecha_nacimiento || 'N/A',
          'Domicilio': p.domicilio_actual || 'No registrado',
          'Lugar': p.lugar || 'N/A',
          'Teléfono': p.telefono || 'No registrado',
          'Tipo de Seguro': p.tipo_de_seguro || 'No especificado',
          'Profesión Familiar (PROFAM)': p.profam || 'N/A',
          'Fecha de Registro': p.fecha_registro || 'N/A',
          'Tipo de Documento': p.tipo_documento || 'DNI'
        };
      });
    };

    // ✨ DETECTAR SI LA PREGUNTA ES SOBRE UN PACIENTE
    const analizarPregunta = (pregunta) => {
      const textoLower = pregunta.toLowerCase();
      
      const palabrasClave = [
        'paciente', 'dni', 'buscar', 'busca', 'datos',
        'información', 'historial', 'historia', 'quien es', 'quién es',
        'dame', 'muestra', 'encuentra', 'consulta', 'apellido',
        'nombre', 'teléfono', 'telefono', 'domicilio', 'dirección',
        'edad', 'seguro', 'cuando ingreso', 'cuándo ingresó',
        'fecha de nacimiento', 'hc', 'historia clínica'
      ];

      const esPreguntaDeDB = palabrasClave.some(palabra => textoLower.includes(palabra));

      if (!esPreguntaDeDB) {
        return { esDB: false };
      }

      // Extraer DNI (números de 3 a 8 dígitos)
      const dniMatch = pregunta.match(/\b\d{3,8}\b/);
      if (dniMatch) {
        console.log('📋 DNI detectado:', dniMatch[0]);
        return { esDB: true, criterio: dniMatch[0] };
      }

      // Extraer nombres/apellidos
      const patronNombres = /(?:paciente|apellido|nombre|datos de|información de|del paciente)\s+([a-záéíóúñ\s]+?)(?:\s|$|\?|\.)/i;
      const nombreMatch = pregunta.match(patronNombres);
      if (nombreMatch) {
        const nombre = nombreMatch[1].trim();
        console.log('👤 Nombre/Apellido detectado:', nombre);
        return { esDB: true, criterio: nombre };
      }

      return { esDB: true, busquedaGeneral: true };
    };

    onMounted(async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user.value = currentUser;
      
      chat.value = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ 
              text: `Eres un asistente médico del Centro de Salud Chincha Baja. Cuando te den datos de pacientes:

1. Presenta la información de forma clara, organizada y fácil de leer
2. Usa viñetas o listas cuando sea apropiado
3. Resalta la información más importante (DNI, HC, Nombres completos)
4. Si hay múltiples pacientes, preséntalos numerados
5. Si no se encuentra el paciente, sugiere amablemente verificar el DNI o apellido
6. Responde siempre en español y de forma profesional pero amigable
7. Si te preguntan cuándo ingresó un paciente, usa la "Fecha de Registro"
8. Calcula la edad si te la piden basándote en la fecha de nacimiento

Formato sugerido para presentar datos:
**Paciente encontrado:**
- DNI: [dni]
- HC: [hc]
- Nombre completo: [nombres] [apellidos]
- Edad: [edad] años
- Otros datos relevantes...` 
            }],
          },
          {
            role: "model",
            parts: [{ text: "Entendido. Presentaré la información de pacientes de forma clara, organizada y profesional. ¿Qué consulta necesitas realizar?" }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
        },
      });
      
      scrollToBottom();
    });

    const goHome = () => {
      router.push('/home');
    };

    const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/');
    };

    const sendMessage = async () => {
      if (!currentMessage.value.trim() || loading.value) return;

      const userText = currentMessage.value.trim();
      currentMessage.value = '';
      loading.value = true;

      messages.value.push({
        id: Date.now(),
        text: userText,
        sender: 'user',
      });
      scrollToBottom();

      try {
        const analisis = analizarPregunta(userText);
        let mensajeParaGemini = userText;

        if (analisis.esDB && analisis.criterio) {
          console.log('🔍 Buscando en la base de datos...');
          
          const pacientes = await buscarPaciente(analisis.criterio);
          
          if (pacientes && pacientes.length > 0) {
            const infoPacientes = formatearDatosPaciente(pacientes);

            mensajeParaGemini = `El usuario pregunta: "${userText}"

DATOS ENCONTRADOS EN LA BASE DE DATOS (${pacientes.length} resultado${pacientes.length > 1 ? 's' : ''}):

${JSON.stringify(infoPacientes, null, 2)}

Por favor, presenta esta información de forma clara y profesional al usuario. Si hay múltiples resultados, numéralos.`;
            
            console.log('✅ Pacientes encontrados:', infoPacientes);
          } else {
            mensajeParaGemini = `El usuario pregunta: "${userText}"

RESULTADO: No se encontraron pacientes con ese DNI, nombre o apellido en la base de datos del Centro de Salud Chincha Baja.

Por favor, informa amablemente al usuario que no se encontraron resultados y sugiere:
1. Verificar que el DNI esté correcto (sin espacios ni guiones)
2. Verificar la ortografía del nombre o apellido
3. Intentar buscar solo por apellido si buscó por nombre completo`;
            
            console.log('❌ No se encontraron pacientes');
          }
        } else if (analisis.esDB && analisis.busquedaGeneral) {
          mensajeParaGemini = `${userText}

Por favor, pide amablemente al usuario que especifique:
- El DNI del paciente (ejemplo: 32330)
- O el nombre/apellido del paciente (ejemplo: Cornejo Saucedo)

Esto ayudará a realizar una búsqueda más precisa en la base de datos.`;
        }

        console.log('📤 Enviando a Gemini...');
        const result = await chat.value.sendMessage(mensajeParaGemini);
        const response = await result.response;
        const botResponse = response.text();

        console.log('📥 Respuesta de Gemini:', botResponse);

        messages.value.push({
          id: Date.now() + 1,
          text: botResponse,
          sender: 'bot',
        });

      } catch (error) {
        console.error("❌ Error completo:", error);
        messages.value.push({
          id: Date.now() + 1,
          text: "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo o contacta al administrador del sistema.",
          sender: 'bot',
        });
      } finally {
        loading.value = false;
        scrollToBottom();
      }
    };

    return {
      user,
      userInitial,
      messages,
      currentMessage,
      loading,
      messageHistoryRef,
      handleLogout,
      goHome,
      sendMessage,
      formatMessage,
    };
  },
};
</script>

<style scoped>
/* Estilos reutilizados para la NavBar */
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
  color: #000000;
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

/* Estilos Específicos del Chatbot */
.ia-page {
  min-height: 100vh;
  background:rgb(243, 239, 249);
  display: flex;
  flex-direction: column;
}

.chat-container {
  max-width: 900px;
  width: 100%;
  margin: 2rem auto;
  background: rgb(159, 159, 159);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: calc(100vh - 140px);
}

.chat-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #b2146a 100%);
  color: white;
  text-align: center;
}

.chat-header h1 {
  font-size: 26px;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.chat-header p {
  font-size: 14px;
  opacity: 0.9;
}

.message-history {
  flex-grow: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f9fa;
}

.message {
  display: flex;
  max-width: 75%;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  margin-left: auto;
  justify-content: flex-end;
}

.message.bot {
  margin-right: auto;
  justify-content: flex-start;
}

.message-bubble {
  padding: 12px 18px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.5;
  word-wrap: break-word;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.bot .message-bubble {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  border: 1px solid #e0e0e0;
}

.message.bot.loading .message-bubble {
  background: white;
  border: 1px solid #e0e0e0;
  padding: 18px 24px;
}

/* Indicador de escritura animado */
.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.chat-input-area {
  display: flex;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  gap: 12px;
  background: white;
}

.chat-input-area input {
  flex-grow: 1;
  padding: 12px 18px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  font-size: 15px;
  transition: border-color 0.3s;
  outline: none;
}

.chat-input-area input:focus {
  border-color: #667eea;
}

.chat-input-area button {
  padding: 12px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.chat-input-area button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.chat-input-area button:disabled {
  background: #b1b1b1;
  cursor: not-allowed;
  box-shadow: none;
}

/* Scrollbar personalizado */
.message-history::-webkit-scrollbar {
  width: 6px;
}

.message-history::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.message-history::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.message-history::-webkit-scrollbar-thumb:hover {
  background: #5a6ed1;
}


</style>