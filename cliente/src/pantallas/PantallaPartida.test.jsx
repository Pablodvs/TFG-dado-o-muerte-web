import { act, fireEvent, screen, within } from '@testing-library/react';
import * as api from '../api';
import { ESPERA_ARMADO } from '../hooks/useArmado';
import { DURACION_TIRADA } from '../hooks/useTurno';
import { leerPartidaId } from '../lib/almacen';
import { crearStore } from '../store';
import {
    errorDeRed,
    errorHttp,
    estadoPartida,
    ID_PARTIDA,
    jugador,
    prepararDados,
    renderApp,
} from '../test-utils';

vi.mock('../api', async (importOriginal) => ({
    ...(await importOriginal()),
    crearPartida: vi.fn(),
    obtenerPartida: vi.fn(),
    plantarse: vi.fn(),
}));

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dadoOMuerte:partidaId', ID_PARTIDA);
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

const trasAna = estadoPartida({
    turno: 1,
    tiradaMax: 2,
    jugadores: [
        jugador(5, 'Ana', 1, { haJugado: true, puntuacion: 35, dados: [2, 2, 5, 5, 5] }),
        jugador(6, 'Luis', 2),
    ],
    jugadorActual: { id: 6, nombre: 'Luis', vidas: 3 },
    peorTirada: { jugadorId: 5, nombre: 'Ana', puntuacion: 35, dados: [2, 2, 5, 5, 5] },
});

function dados() {
    return within(screen.getByRole('list', { name: 'Tus dados' })).getAllByRole('button');
}

function contador() {
    return screen.getByText((_, el) => el.tagName === 'P' && /^Tirada \d\/\d$/.test(el.textContent));
}

function jugadaActual() {
    return screen.getByText((_, el) => el.tagName === 'P' && el.textContent.startsWith('Llevas: '));
}

function etiquetasDados() {
    return dados().map(d => d.getAttribute('aria-label'));
}

function tirar(...valores) {
    prepararDados(...valores);
    fireEvent.click(screen.getByRole('button', { name: /^(Tirar dados|Volver a tirar)$/ }));
    act(() => {
        vi.advanceTimersByTime(DURACION_TIRADA);
    });
}

// Las pantallas recién aparecidas no responden durante ESPERA_ARMADO (doble toque)
function esperarArmado() {
    act(() => {
        vi.advanceTimersByTime(ESPERA_ARMADO);
    });
}

async function empezarTurno(nombre) {
    const aviso = await screen.findByRole('button', { name: new RegExp(`Turno de\\s*${nombre}`) });
    esperarArmado();
    fireEvent.click(aviso);
}

test('antes de cada turno pide pasar el móvil', async () => {
    api.obtenerPartida.mockResolvedValue(estadoPartida());
    renderApp('/partida');

    expect(screen.getByText('Cargando partida…')).toBeInTheDocument();
    const aviso = await screen.findByRole('button', { name: /Turno de\s*Ana/ });
    expect(aviso).toHaveTextContent('Abres la ronda: puedes tirar hasta 3 veces.');
    expect(screen.queryByRole('list', { name: 'Tus dados' })).not.toBeInTheDocument();
    // Marcador siempre visible, con el jugador actual marcado
    const marcador = screen.getByRole('region', { name: 'Marcador' });
    const actual = within(marcador).getAllByRole('listitem').filter(li => li.getAttribute('aria-current') === 'true');
    expect(actual).toHaveLength(1);
    expect(actual[0]).toHaveTextContent('Ana');
    expect(screen.getByText('Nadie ha jugado todavía en esta ronda.')).toBeInTheDocument();
    expect(api.obtenerPartida).toHaveBeenCalledWith(ID_PARTIDA);
});

test('un turno completo: tirar, guardar, volver a tirar y plantarse con los 5 dados', async () => {
    api.obtenerPartida.mockResolvedValue(estadoPartida());
    api.plantarse.mockResolvedValue({ partida: trasAna, rondaTerminada: null });
    renderApp('/partida');
    await empezarTurno('Ana');

    // Sin tirar: no se pueden guardar dados ni plantarse
    expect(etiquetasDados()).toEqual(Array(5).fill('Dado: sin tirar'));
    dados().forEach(d => expect(d).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Plantarse' })).toBeDisabled();
    expect(contador()).toHaveTextContent('Tirada 0/3');

    tirar(2, 2, 3, 4, 6);
    expect(etiquetasDados()).toEqual(['Dado: 2', 'Dado: 2', 'Dado: 3', 'Dado: 4', 'Dado: 6']);
    expect(contador()).toHaveTextContent('Tirada 1/3');
    expect(jugadaActual()).toHaveTextContent('Llevas: Pareja de 2');

    fireEvent.click(dados()[0]);
    fireEvent.click(dados()[1]);
    expect(dados()[0]).toHaveAttribute('aria-pressed', 'true');
    expect(dados()[0]).toHaveAttribute('aria-label', 'Dado: 2, guardado');

    // Solo se vuelven a tirar los tres dados sin guardar
    tirar(5, 5, 5);
    expect(etiquetasDados()).toEqual(['Dado: 2, guardado', 'Dado: 2, guardado', 'Dado: 5', 'Dado: 5', 'Dado: 5']);
    expect(jugadaActual()).toHaveTextContent('Llevas: Trío de 5');

    fireEvent.click(screen.getByRole('button', { name: 'Plantarse' }));

    // Tras plantarse, el móvil pasa a Luis, que tiene las tiradas que usó Ana
    const aviso = await screen.findByRole('button', { name: /Turno de\s*Luis/ });
    expect(aviso).toHaveTextContent('Tienes 2 tiradas.');
    expect(api.plantarse).toHaveBeenCalledWith(ID_PARTIDA, { jugadorId: 5, ronda: 1, dados: [2, 2, 5, 5, 5], tiradas: 2 });
    expect(localStorage.getItem('dadoOMuerte:turno')).toBeNull();
    const peor = screen.getByRole('region', { name: 'Tirada a superar' });
    expect(peor).toHaveTextContent('Ana: Trío de 5');
});

test('un doble toque en Plantarse no se salta la pantalla de pasar el móvil', async () => {
    api.obtenerPartida.mockResolvedValue(estadoPartida());
    api.plantarse.mockResolvedValue({ partida: trasAna, rondaTerminada: null });
    renderApp('/partida');
    await empezarTurno('Ana');
    tirar(2, 2, 5, 5, 5);
    fireEvent.click(screen.getByRole('button', { name: 'Plantarse' }));
    const aviso = await screen.findByRole('button', { name: /Turno de\s*Luis/ });

    // Recién aparecida, la cortina no responde y se ve apagada
    // (findByRole ya ha avanzado el reloj falso unos milisegundos)
    expect(aviso).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(aviso);
    act(() => {
        vi.advanceTimersByTime(ESPERA_ARMADO / 2);
    });
    fireEvent.click(aviso);
    expect(screen.queryByRole('list', { name: 'Tus dados' })).not.toBeInTheDocument();
    expect(aviso).toHaveAttribute('aria-disabled', 'true');

    // Pasado ese instante, ya se puede empezar (también con Intro, que es un clic)
    esperarArmado();
    expect(aviso).not.toHaveAttribute('aria-disabled');
    fireEvent.click(aviso);
    expect(screen.getByRole('list', { name: 'Tus dados' })).toBeInTheDocument();
    expect(contador()).toHaveTextContent('Tirada 0/2');
});

test('recargar a mitad de turno no regala tiradas', async () => {
    api.obtenerPartida.mockResolvedValue(estadoPartida());
    const { unmount } = renderApp('/partida');
    await empezarTurno('Ana');
    tirar(6, 6, 1, 3, 4);
    fireEvent.click(dados()[0]);
    unmount();

    // Store nuevo, como tras recargar la página
    renderApp('/partida', crearStore());
    await empezarTurno('Ana');

    expect(etiquetasDados()).toEqual(['Dado: 6, guardado', 'Dado: 6', 'Dado: 1', 'Dado: 3', 'Dado: 4']);
    expect(contador()).toHaveTextContent('Tirada 1/3');
    expect(screen.getByRole('button', { name: 'Plantarse' })).toBeEnabled();
});

test('sin tiradas restantes solo queda plantarse', async () => {
    api.obtenerPartida.mockResolvedValue(trasAna);
    renderApp('/partida');
    await empezarTurno('Luis');

    tirar(2, 3, 3, 4, 6);
    tirar(2, 3, 3, 4, 6);

    expect(contador()).toHaveTextContent('Tirada 2/2');
    expect(screen.getByRole('button', { name: 'Volver a tirar' })).toBeDisabled();
    dados().forEach(d => expect(d).toBeDisabled());
    expect(jugadaActual()).toHaveTextContent('Ahora mismo serías la peor tirada');
});

test('al acabar la ronda enseña quién pierde la vida y sigue', async () => {
    const rondaTerminada = {
        ronda: 1,
        perdedor: { id: 6, nombre: 'Luis', vidas: 2 },
        puntuacion: 23,
        dados: [2, 3, 3, 4, 6],
        finPartida: false,
    };
    const ronda2 = estadoPartida({
        ronda: 2,
        jugadores: [jugador(6, 'Luis', 1, { vidas: 2 }), jugador(5, 'Ana', 2)],
        jugadorActual: { id: 6, nombre: 'Luis', vidas: 2 },
    });
    api.obtenerPartida.mockResolvedValue(trasAna);
    api.plantarse.mockResolvedValue({ partida: ronda2, rondaTerminada });
    renderApp('/partida');
    await empezarTurno('Luis');
    tirar(2, 3, 3, 4, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Plantarse' }));

    expect(await screen.findByRole('heading', { name: 'Fin de la ronda 1' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Luis pierde una vida — le quedan 2 vidas');

    // El segundo toque de un doble toque en "Plantarse" cae aquí: no se salta el resumen
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente ronda' }));
    expect(screen.getByRole('heading', { name: 'Fin de la ronda 1' })).toBeInTheDocument();

    esperarArmado();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente ronda' }));

    const aviso = screen.getByRole('button', { name: /Turno de\s*Luis/ });
    expect(aviso).toHaveTextContent('Abres la ronda');
    expect(screen.getByRole('heading', { name: 'Ronda 2' })).toBeInTheDocument();
    // Ni un doble toque en "Siguiente ronda" se salta la cortina
    fireEvent.click(aviso);
    expect(screen.queryByRole('list', { name: 'Tus dados' })).not.toBeInTheDocument();
});

test('si la partida termina, pasa a la pantalla final', async () => {
    const fin = estadoPartida({
        finalizada: true,
        jugadores: [jugador(6, 'Luis', 1, { vidas: 0 }), jugador(5, 'Ana', 2, { vidas: 2 })],
        jugadorActual: null,
        perdedor: { id: 6, nombre: 'Luis' },
    });
    api.obtenerPartida.mockResolvedValue(trasAna);
    api.plantarse.mockResolvedValue({
        partida: fin,
        rondaTerminada: {
            ronda: 5, perdedor: { id: 6, nombre: 'Luis', vidas: 0 }, puntuacion: 23, dados: [2, 3, 3, 4, 6], finPartida: true,
        },
    });
    renderApp('/partida');
    await empezarTurno('Luis');
    tirar(2, 3, 3, 4, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Plantarse' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Luis pierde una vida — se queda sin vidas');
    esperarArmado();
    fireEvent.click(screen.getByRole('button', { name: 'Ver resultado final' }));

    expect(screen.getByRole('heading', { name: 'Fin de la partida' })).toBeInTheDocument();
    // "Revancha" está donde "Ver resultado final": un doble toque no la pulsa
    fireEvent.click(screen.getByRole('button', { name: 'Revancha' }));
    expect(api.crearPartida).not.toHaveBeenCalled();
    expect(screen.getByText(/pierde la partida/)).toHaveTextContent('Luis pierde la partida');
    // La última jugada solo viene en la respuesta de plantarse
    const ultima = screen.getByRole('region', { name: 'Última ronda (5)' });
    expect(ultima).toHaveTextContent('Luis: Pareja de 3');
});

test('un 409 al plantarse recarga la partida sin mostrar error', async () => {
    api.obtenerPartida.mockResolvedValueOnce(estadoPartida()).mockResolvedValueOnce(trasAna);
    api.plantarse.mockRejectedValue(errorHttp(409, 'La ronda ya ha terminado'));
    renderApp('/partida');
    await empezarTurno('Ana');
    tirar(2, 2, 5, 5, 5);

    fireEvent.click(screen.getByRole('button', { name: 'Plantarse' }));
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();

    expect(await screen.findByRole('button', { name: /Turno de\s*Luis/ })).toBeInTheDocument();
    expect(api.obtenerPartida).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('muestra el error del servidor al plantarse y deja reintentar', async () => {
    api.obtenerPartida.mockResolvedValue(estadoPartida());
    api.plantarse.mockRejectedValueOnce(errorDeRed());
    renderApp('/partida');
    await empezarTurno('Ana');
    tirar(2, 3, 3, 4, 6);

    fireEvent.click(screen.getByRole('button', { name: 'Plantarse' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se puede conectar con el servidor');
    expect(screen.getByRole('button', { name: 'Plantarse' })).toBeEnabled();
    expect(etiquetasDados()).toEqual(['Dado: 2', 'Dado: 3', 'Dado: 3', 'Dado: 4', 'Dado: 6']);
});

test('si el servidor no responde, deja reintentar la carga', async () => {
    api.obtenerPartida.mockRejectedValueOnce(errorDeRed()).mockResolvedValueOnce(estadoPartida());
    renderApp('/partida');

    expect(await screen.findByRole('heading', { name: 'No se ha podido cargar la partida' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('button', { name: /Turno de\s*Ana/ })).toBeInTheDocument();
});

test('si la partida no existe, vuelve al inicio', async () => {
    api.obtenerPartida.mockRejectedValue(errorHttp(404, 'Partida no encontrada'));
    renderApp('/partida');

    expect(await screen.findByRole('heading', { name: 'Nueva partida' })).toBeInTheDocument();
    expect(leerPartidaId()).toBeNull();
});

test('sin partida guardada, vuelve al inicio', () => {
    localStorage.clear();
    renderApp('/partida');
    expect(screen.getByRole('heading', { name: 'Nueva partida' })).toBeInTheDocument();
    expect(api.obtenerPartida).not.toHaveBeenCalled();
});
