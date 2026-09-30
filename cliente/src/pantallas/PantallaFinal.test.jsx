import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import * as api from '../api';
import { leerPartidaId } from '../lib/almacen';
import { estadoPartida, jugador, nombresDe, renderApp } from '../test-utils';

jest.mock('../api', () => ({
    ...jest.requireActual('../api'),
    crearPartida: jest.fn(),
    obtenerPartida: jest.fn(),
    plantarse: jest.fn(),
}));

const terminada = estadoPartida({
    ronda: 7,
    finalizada: true,
    jugadores: [
        jugador(6, 'Luis', 1, { vidas: 0 }),
        jugador(7, 'Eva', 2, { vidas: 1 }),
        jugador(5, 'Ana', 3, { vidas: 2 }),
    ],
    jugadorActual: null,
    perdedor: { id: 6, nombre: 'Luis' },
});

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dadoOMuerte:partidaId', '12');
});

// Los botones no responden hasta un instante después de aparecer (doble toque)
async function botonArmado(nombre) {
    const boton = await screen.findByRole('button', { name: nombre });
    await waitFor(() => expect(boton).not.toHaveAttribute('aria-disabled'));
    return boton;
}

test('tras recargar, muestra el perdedor real y la clasificación', async () => {
    api.obtenerPartida.mockResolvedValue(terminada);
    renderApp('/fin');

    expect(await screen.findByText(/pierde la partida/)).toHaveTextContent('Luis pierde la partida');
    expect(nombresDe(screen.getByRole('region', { name: 'Clasificación' }))).toEqual(['Ana', 'Eva', 'Luis']);
});

test('la ruta antigua /pantalla-final lleva a /fin', async () => {
    api.obtenerPartida.mockResolvedValue(terminada);
    renderApp('/pantalla-final');
    expect(await screen.findByRole('heading', { name: 'Fin de la partida' })).toBeInTheDocument();
});

test('revancha crea una partida nueva con los mismos nombres', async () => {
    api.obtenerPartida.mockResolvedValue(terminada);
    api.crearPartida.mockResolvedValue(estadoPartida({ id: 13 }));
    renderApp('/fin');

    fireEvent.click(await botonArmado('Revancha'));

    expect(await screen.findByText('Toca para empezar')).toBeInTheDocument();
    expect(api.crearPartida).toHaveBeenCalledWith(['Luis', 'Eva', 'Ana']);
    expect(leerPartidaId()).toBe(13);
});

test('menú principal olvida la partida', async () => {
    api.obtenerPartida.mockResolvedValue(terminada);
    renderApp('/fin');

    fireEvent.click(await botonArmado('Menú principal'));

    expect(screen.getByRole('heading', { name: 'Nueva partida' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Continuar partida' })).not.toBeInTheDocument();
    expect(leerPartidaId()).toBeNull();
});

test('si la partida sigue en juego, vuelve a la pantalla de juego', async () => {
    api.obtenerPartida.mockResolvedValue(estadoPartida());
    renderApp('/fin');
    expect(await screen.findByText('Toca para empezar')).toBeInTheDocument();
});

test('sin el resumen de la última ronda (tras recargar) no la muestra', async () => {
    api.obtenerPartida.mockResolvedValue({ ...terminada, peorTirada: null });
    renderApp('/fin');
    await screen.findByText(/pierde la partida/);
    expect(screen.queryByRole('region', { name: /Última ronda/ })).not.toBeInTheDocument();
});

test('con las mismas vidas se comparte puesto en la clasificación', async () => {
    api.obtenerPartida.mockResolvedValue(estadoPartida({
        finalizada: true,
        jugadores: [
            jugador(6, 'Luis', 1, { vidas: 0 }),
            jugador(7, 'Eva', 2, { vidas: 2 }),
            jugador(5, 'Ana', 3, { vidas: 3 }),
            jugador(8, 'Pablo', 4, { vidas: 2 }),
        ],
        jugadorActual: null,
        perdedor: { id: 6, nombre: 'Luis' },
    }));
    renderApp('/fin');

    const clasificacion = await screen.findByRole('region', { name: 'Clasificación' });
    const filas = within(clasificacion).getAllByRole('listitem');
    expect(nombresDe(clasificacion)).toEqual(['Ana', 'Eva', 'Pablo', 'Luis']);
    expect(filas.map(li => li.getAttribute('value'))).toEqual(['1', '2', '2', '4']);
});
