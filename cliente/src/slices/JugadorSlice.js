import { createSlice } from "@reduxjs/toolkit";

const jugadorSlice = createSlice({
    name: 'jugador',
    initialState: {},
    reducers: {
        setJugador(state, action) {
            return action.payload
        }
    }
})

export const { setJugador } = jugadorSlice.actions;
export default jugadorSlice.reducer;
