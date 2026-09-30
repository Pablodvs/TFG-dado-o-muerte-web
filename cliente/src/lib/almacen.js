// Persistencia en localStorage: la partida en curso y el turno a medias, para
// que recargar la página (algo habitual en el móvil) no pierda nada.
import { NUM_DADOS, TIRADAS_MAXIMAS } from './reglas';

const CLAVE_PARTIDA = 'dadoOMuerte:partidaId';
const CLAVE_TURNO = 'dadoOMuerte:turno';
const CLAVE_IDIOMA = 'dadoOMuerte:idioma';

function leer(clave) {
    try {
        return window.localStorage.getItem(clave);
    } catch {
        return null;
    }
}

function escribir(clave, valor) {
    try {
        if (valor === null) window.localStorage.removeItem(clave);
        else window.localStorage.setItem(clave, valor);
    } catch {
        // Sin almacenamiento (modo privado...): la partida sigue, pero no sobrevive a una recarga
    }
}

// El id público que genera el servidor: 22 caracteres base64url
const FORMATO_ID = /^[A-Za-z0-9_-]{22}$/;

export function leerPartidaId() {
    const id = leer(CLAVE_PARTIDA);
    return id !== null && FORMATO_ID.test(id) ? id : null;
}

export function guardarPartidaId(id) {
    escribir(CLAVE_PARTIDA, id);
    borrarTurno();
}

export function borrarPartidaId() {
    escribir(CLAVE_PARTIDA, null);
    borrarTurno();
}

// Identifica un turno concreto: cada jugador juega una sola vez por ronda
export function claveTurno(partidaId, ronda, jugadorId) {
    return `${partidaId}:${ronda}:${jugadorId}`;
}

function esDadoValido(dado) {
    return Boolean(dado)
        && typeof dado.guardado === 'boolean'
        && Number.isInteger(dado.valor) && dado.valor >= 1 && dado.valor <= 6;
}

// Solo se guarda un turno a la vez; si la clave no coincide se ignora
export function leerTurno(clave) {
    try {
        const guardado = JSON.parse(leer(CLAVE_TURNO));
        if (!guardado || guardado.clave !== clave) return null;
        const { dados, tirada } = guardado;
        const valido = Array.isArray(dados)
            && dados.length === NUM_DADOS
            && dados.every(esDadoValido)
            && Number.isInteger(tirada) && tirada >= 1 && tirada <= TIRADAS_MAXIMAS;
        return valido ? { dados, tirada } : null;
    } catch {
        return null;
    }
}

export function guardarTurno(clave, { dados, tirada }) {
    escribir(CLAVE_TURNO, JSON.stringify({ clave, dados, tirada }));
}

export function borrarTurno() {
    escribir(CLAVE_TURNO, null);
}

// El idioma elegido a mano (null si nunca se ha cambiado)
export function leerIdioma() {
    return leer(CLAVE_IDIOMA);
}

export function guardarIdioma(idioma) {
    escribir(CLAVE_IDIOMA, idioma);
}
