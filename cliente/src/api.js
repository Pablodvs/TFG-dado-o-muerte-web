import axios from 'axios';

// Mismo origen por defecto: en desarrollo el "proxy" de package.json reenvía
// /api al servidor (puerto 3001). Para otro host, definir REACT_APP_API_URL.
const cliente = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '',
    timeout: 10000,
});

function comprobarEstado(estado) {
    // Si no hay servidor detrás, algunos hosts devuelven index.html con un 200
    if (!estado || typeof estado !== 'object' || !Array.isArray(estado.jugadores)) {
        throw Object.assign(new Error('Respuesta inesperada del servidor'), { respuestaInesperada: true });
    }
    return estado;
}

// → EstadoPartida
export async function crearPartida(nombres) {
    const { data } = await cliente.post('/api/partidas', { jugadores: nombres });
    return comprobarEstado(data?.partida);
}

// → EstadoPartida
export async function obtenerPartida(id) {
    const { data } = await cliente.get(`/api/partidas/${id}`);
    return comprobarEstado(data);
}

// → { partida: EstadoPartida, rondaTerminada: RondaTerminada | null }
// ronda: la que se está jugando; si ya ha terminado el servidor responde 409
export async function plantarse(id, { jugadorId, ronda, dados, tiradas }) {
    const { data } = await cliente.post(`/api/partidas/${id}/plantarse`, { jugadorId, ronda, dados, tiradas });
    comprobarEstado(data?.partida);
    return { partida: data.partida, rondaTerminada: data.rondaTerminada ?? null };
}

// Convierte cualquier fallo en { status, mensaje } serializable para Redux.
// status es null cuando ni siquiera hubo respuesta (sin conexión, servidor caído).
export function describirError(error) {
    const respuesta = error?.response;
    if (error?.respuestaInesperada) {
        return { status: null, mensaje: 'El servidor ha respondido algo inesperado. ¿Está en marcha la API?' };
    }
    if (!respuesta) {
        const mensaje = error?.isAxiosError || error?.code === 'ECONNABORTED'
            ? 'No se puede conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.'
            : 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
        return { status: null, mensaje };
    }
    const { status, data } = respuesta;
    if (typeof data?.error === 'string' && data.error) return { status, mensaje: data.error };
    if (status === 404) return { status, mensaje: 'Esa partida no existe.' };
    if (status >= 500) return { status, mensaje: 'El servidor no está disponible ahora mismo. Inténtalo de nuevo en un momento.' };
    return { status, mensaje: 'El servidor ha rechazado la petición.' };
}
