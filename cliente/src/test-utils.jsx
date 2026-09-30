// Utilidades compartidas por los tests (no es un test en sí)
import { render, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { crearStore } from './store';

export function renderApp(ruta = '/', store = crearStore()) {
    const utils = render(
        <Provider store={store}>
            <MemoryRouter initialEntries={[ruta]} useTransitions={false}>
                <App />
            </MemoryRouter>
        </Provider>,
    );
    return { store, ...utils };
}

// Primer texto de cada fila de una lista (el nombre del jugador)
export function nombresDe(lista) {
    return within(lista).getAllByRole('listitem').map(li => li.firstChild.textContent);
}

export function jugador(id, nombre, orden, extra = {}) {
    return { id, nombre, vidas: 3, orden, haJugado: false, puntuacion: null, dados: null, ...extra };
}

// Ids públicos de ejemplo, con el formato que genera el servidor
export const ID_PARTIDA = 'k3Vq9mTz2LpR8wNa1bC0dQ';
export const OTRA_PARTIDA = 'Zp7Lr0Xc4Vb6Nm1Qw9Es2T';

// EstadoPartida de ejemplo: Ana abre la ronda 1 contra Luis
export function estadoPartida(extra = {}) {
    return {
        id: ID_PARTIDA,
        ronda: 1,
        turno: 0,
        tiradaMax: null,
        finalizada: false,
        perdedor: null,
        jugadores: [jugador(5, 'Ana', 1), jugador(6, 'Luis', 2)],
        jugadorActual: { id: 5, nombre: 'Ana', vidas: 3 },
        peorTirada: null,
        ...extra,
    };
}

// codigo: el que manda el servidor para traducir el error (opcional)
export function errorHttp(status, mensaje, codigo) {
    const data = mensaje ? { error: mensaje, ...(codigo && { codigo }) } : '';
    return Object.assign(new Error(`HTTP ${status}`), {
        isAxiosError: true,
        response: { status, data },
    });
}

export function errorDeRed() {
    return Object.assign(new Error('Network Error'), { isAxiosError: true });
}

// Las próximas llamadas a Math.random darán estos valores de dado
export function prepararDados(...valores) {
    const espia = vi.spyOn(Math, 'random');
    valores.forEach(v => espia.mockReturnValueOnce((v - 1) / 6 + 0.01));
    return espia;
}
