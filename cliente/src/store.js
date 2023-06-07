import { configureStore } from '@reduxjs/toolkit';
import jugadorReducer from "./slices/JugadorSlice"
import partidaReducer from './slices/PartidaSlice'

const store = configureStore({
    reducer: {
        jugador: jugadorReducer,
        partida: partidaReducer,
    }
})

export default store

