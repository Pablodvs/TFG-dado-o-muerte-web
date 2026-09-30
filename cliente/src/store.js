import { configureStore } from '@reduxjs/toolkit';
import partidaReducer from './slices/partida';

export function crearStore(preloadedState) {
    return configureStore({
        reducer: { partida: partidaReducer },
        preloadedState,
    });
}

const store = crearStore();

export default store;
