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

// Convierte cualquier fallo en { status, codigo, mensaje } serializable para Redux.
// status es null cuando ni siquiera hubo respuesta (sin conexión, servidor caído).
// codigo es la clave de errores.* con la que se traduce (la manda el servidor o se
// deduce aquí); mensaje, el texto del servidor, por si su código no se conoce.
export function describirError(error) {
    const respuesta = error?.response;
    if (error?.respuestaInesperada) {
        return { status: null, codigo: 'respuestaInesperada', mensaje: null };
    }
    if (!respuesta) {
        const codigo = error?.isAxiosError || error?.code === 'ECONNABORTED' ? 'sinConexion' : 'inesperado';
        return { status: null, codigo, mensaje: null };
    }
    const { status, data } = respuesta;
    const mensaje = typeof data?.error === 'string' && data.error ? data.error : null;
    if (typeof data?.codigo === 'string' && data.codigo) return { status, codigo: data.codigo, mensaje };
    // Sin código: el texto del servidor tal cual o, si no hay, uno según el estado
    if (mensaje) return { status, codigo: null, mensaje };
    if (status === 404) return { status, codigo: 'noExiste', mensaje: null };
    if (status >= 500) return { status, codigo: 'servidorCaido', mensaje: null };
    return { status, codigo: 'rechazada', mensaje: null };
}

// El resultado de describirError en el idioma actual
export function textoError(t, { codigo, mensaje }) {
    const porDefecto = mensaje || t('errores.inesperado');
    return codigo ? t(`errores.${codigo}`, { defaultValue: porDefecto }) : porDefecto;
}
