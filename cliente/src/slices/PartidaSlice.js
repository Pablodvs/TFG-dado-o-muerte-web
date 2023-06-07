
import { createSlice } from "@reduxjs/toolkit";

const partidaSlice = createSlice({
    name: 'partida',
    initialState: {
        jugadores: {},
        id: null,
        perdedor: null,
        turno: 0,
        vidas: null,
        mostrarVidas: false
    },
    reducers: {
        setJugadores(state, action) {
            return {
                ...state,
                jugadores: action.payload
            }
        },
        setId(state, action) {
            return {
                ...state,
                id: action.payload
            }
        },
        setPerdedor(state, action) {
            return {
                ...state,
                perdedor: action.payload
            }
        },
        setTurno(state, action) {
            return {
                ...state,
                turno: action.payload
            }
        },
        setVidas(state, action) {
            return {
                ...state,
                vidas: action.payload
            }
        },
        setMostrarVidas(state, action) {
            return {
                ...state,
                mostrarVidas: !state.mostrarVidas
            }
        }
    }
})

export const { setJugadores, setMostrarVidas, setVidas, setId, setPerdedor, setPeorTirada, setTurno } = partidaSlice.actions;
export default partidaSlice.reducer;




