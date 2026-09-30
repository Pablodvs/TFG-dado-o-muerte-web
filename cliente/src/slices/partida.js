import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as api from '../api';
import { borrarPartidaId, borrarTurno, claveTurno, guardarPartidaId, leerPartidaId } from '../lib/almacen';
import { TIRADAS_MAXIMAS } from '../lib/reglas';

const initialState = {
    estado: null,           // EstadoPartida tal como la devuelve el servidor
    cargando: false,
    errorCarga: null,       // { status, mensaje }
    creando: false,
    errorCreacion: null,
    enviando: false,        // plantarse en curso
    errorJugada: null,
    rondaTerminada: null,   // RondaTerminada pendiente de enseñar
};

function errorDe(action) {
    return action.payload ?? { status: null, mensaje: action.error?.message || 'Error inesperado' };
}

export const crearPartida = createAsyncThunk(
    'partida/crear',
    async (nombres, { rejectWithValue }) => {
        try {
            const estado = await api.crearPartida(nombres);
            guardarPartidaId(estado.id);
            return estado;
        } catch (e) {
            return rejectWithValue(api.describirError(e));
        }
    },
    { condition: (_, { getState }) => !getState().partida.creando },
);

export const cargarPartida = createAsyncThunk(
    'partida/cargar',
    async (id, { rejectWithValue }) => {
        try {
            return await api.obtenerPartida(id);
        } catch (e) {
            const error = api.describirError(e);
            // La partida guardada ya no existe (o el id no vale): se olvida
            if ((error.status === 404 || error.status === 400) && leerPartidaId() === id) {
                borrarPartidaId();
            }
            return rejectWithValue(error);
        }
    },
    { condition: (_, { getState }) => !getState().partida.cargando },
);

// jugada: { jugadorId, dados: number[5], tiradas, ronda? }. Si no se indica la
// ronda se usa la del estado; si ya ha terminado, el servidor responde 409.
export const plantarse = createAsyncThunk(
    'partida/plantarse',
    async (jugada, { getState, dispatch, rejectWithValue }) => {
        const { id, ronda } = getState().partida.estado;
        try {
            const resultado = await api.plantarse(id, { ronda, ...jugada });
            borrarTurno();
            return resultado;
        } catch (e) {
            const error = api.describirError(e);
            if (error.status !== 409) return rejectWithValue(error);
            // 409 (no es su turno, ronda o partida terminada): lo que vemos está
            // desfasado. No es un error para el jugador: se recarga y ya.
            // Se espera a la recarga para que los botones sigan desactivados.
            const recarga = await dispatch(cargarPartida(id));
            const falloRecarga = cargarPartida.rejected.match(recarga) && !recarga.meta.condition;
            return rejectWithValue(falloRecarga ? recarga.payload : error);
        }
    },
    {
        condition: (_, { getState }) => {
            const { estado, enviando } = getState().partida;
            return Boolean(estado) && !enviando;
        },
    },
);

function ponerEstado(state, estado) {
    // Si cambia el turno, el error de la jugada anterior ya no aplica
    if (claveTurnoDe(state.estado) !== claveTurnoDe(estado)) state.errorJugada = null;
    state.estado = estado;
}

const partidaSlice = createSlice({
    name: 'partida',
    initialState,
    reducers: {
        cerrarResumenRonda(state) {
            state.rondaTerminada = null;
        },
        reiniciar() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(crearPartida.pending, (state) => {
                state.creando = true;
                state.errorCreacion = null;
            })
            .addCase(crearPartida.fulfilled, (state, action) => {
                state.creando = false;
                state.errorCarga = null;
                state.errorJugada = null;
                state.rondaTerminada = null;
                state.estado = action.payload;
            })
            .addCase(crearPartida.rejected, (state, action) => {
                state.creando = false;
                state.errorCreacion = errorDe(action);
            })
            .addCase(cargarPartida.pending, (state) => {
                state.cargando = true;
                state.errorCarga = null;
            })
            .addCase(cargarPartida.fulfilled, (state, action) => {
                state.cargando = false;
                if (state.estado?.id !== action.payload.id) state.rondaTerminada = null;
                ponerEstado(state, action.payload);
            })
            .addCase(cargarPartida.rejected, (state, action) => {
                state.cargando = false;
                state.errorCarga = errorDe(action);
            })
            .addCase(plantarse.pending, (state) => {
                state.enviando = true;
                state.errorJugada = null;
            })
            .addCase(plantarse.fulfilled, (state, action) => {
                state.enviando = false;
                state.rondaTerminada = action.payload.rondaTerminada;
                ponerEstado(state, action.payload.partida);
            })
            .addCase(plantarse.rejected, (state, action) => {
                state.enviando = false;
                // Un 409 ya se ha resuelto recargando la partida
                state.errorJugada = action.payload?.status === 409 ? null : errorDe(action);
            });
    },
});

export const { cerrarResumenRonda, reiniciar } = partidaSlice.actions;
export default partidaSlice.reducer;

// "Menú principal": olvida la partida guardada
export const salirDePartida = () => (dispatch) => {
    borrarPartidaId();
    dispatch(reiniciar());
};

export const selectPartida = (state) => state.partida;
export const selectEstado = (state) => state.partida.estado;

// Derivados de EstadoPartida

export function jugadorActualDe(estado) {
    if (!estado || estado.finalizada) return null;
    return estado.jugadorActual ?? estado.jugadores[estado.turno] ?? null;
}

// Quien abre la ronda tiene 3 tiradas; el resto, las que usó quien abrió
export function tiradaMaxDe(estado) {
    return estado?.tiradaMax ?? TIRADAS_MAXIMAS;
}

export function claveTurnoDe(estado) {
    const jugador = jugadorActualDe(estado);
    return jugador ? claveTurno(estado.id, estado.ronda, jugador.id) : null;
}
