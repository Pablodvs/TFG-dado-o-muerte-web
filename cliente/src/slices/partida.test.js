import * as api from '../api';
import { claveTurno, guardarTurno, leerPartidaId, leerTurno } from '../lib/almacen';
import { crearStore } from '../store';
import { errorDeRed, errorHttp, estadoPartida, jugador } from '../test-utils';
import {
    cargarPartida,
    cerrarResumenRonda,
    claveTurnoDe,
    crearPartida,
    jugadorActualDe,
    plantarse,
    salirDePartida,
    tiradaMaxDe,
} from './partida';

jest.mock('../api', () => ({
    ...jest.requireActual('../api'),
    crearPartida: jest.fn(),
    obtenerPartida: jest.fn(),
    plantarse: jest.fn(),
}));

beforeEach(() => localStorage.clear());

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

test('crearPartida guarda el estado y el id', async () => {
    api.crearPartida.mockResolvedValue(estadoPartida());
    const store = crearStore();

    await store.dispatch(crearPartida(['Ana', 'Luis']));

    expect(api.crearPartida).toHaveBeenCalledWith(['Ana', 'Luis']);
    expect(store.getState().partida.estado.id).toBe(12);
    expect(store.getState().partida.creando).toBe(false);
    expect(leerPartidaId()).toBe(12);
});

test('crearPartida guarda el mensaje del servidor si falla', async () => {
    api.crearPartida.mockRejectedValue(errorHttp(400, 'Los nombres no pueden repetirse'));
    const store = crearStore();

    await store.dispatch(crearPartida(['Ana', 'ana']));

    expect(store.getState().partida.errorCreacion).toEqual({ status: 400, codigo: null, mensaje: 'Los nombres no pueden repetirse' });
    expect(leerPartidaId()).toBeNull();
});

test('cargarPartida con 404 olvida la partida guardada', async () => {
    localStorage.setItem('dadoOMuerte:partidaId', '99');
    api.obtenerPartida.mockRejectedValue(errorHttp(404, 'Partida no encontrada'));
    const store = crearStore();

    await store.dispatch(cargarPartida(99));

    expect(store.getState().partida.errorCarga).toEqual({ status: 404, codigo: null, mensaje: 'Partida no encontrada' });
    expect(leerPartidaId()).toBeNull();
});

test('cargarPartida sin conexión conserva la partida guardada', async () => {
    localStorage.setItem('dadoOMuerte:partidaId', '12');
    api.obtenerPartida.mockRejectedValue(errorDeRed());
    const store = crearStore();

    await store.dispatch(cargarPartida(12));

    expect(store.getState().partida.errorCarga.status).toBeNull();
    expect(store.getState().partida.errorCarga.codigo).toBe('sinConexion');
    expect(leerPartidaId()).toBe(12);
});

test('plantarse envía la jugada, borra el turno guardado y avanza', async () => {
    api.plantarse.mockResolvedValue({ partida: trasAna, rondaTerminada: null });
    const store = crearStore({ partida: { ...crearStore().getState().partida, estado: estadoPartida() } });
    const clave = claveTurno(12, 1, 5);
    guardarTurno(clave, { dados: [2, 2, 5, 5, 5].map(valor => ({ valor, guardado: false })), tirada: 2 });

    await store.dispatch(plantarse({ jugadorId: 5, ronda: 1, dados: [2, 2, 5, 5, 5], tiradas: 2 }));

    expect(api.plantarse).toHaveBeenCalledWith(12, { jugadorId: 5, ronda: 1, dados: [2, 2, 5, 5, 5], tiradas: 2 });
    expect(leerTurno(clave)).toBeNull();
    const { estado, enviando, rondaTerminada } = store.getState().partida;
    expect(enviando).toBe(false);
    expect(rondaTerminada).toBeNull();
    expect(jugadorActualDe(estado).nombre).toBe('Luis');
    expect(tiradaMaxDe(estado)).toBe(2);
});

test('plantarse envía la ronda que se está jugando', async () => {
    api.plantarse.mockResolvedValue({ partida: estadoPartida({ ronda: 4, turno: 1 }), rondaTerminada: null });
    const store = crearStore({ partida: { ...crearStore().getState().partida, estado: estadoPartida({ ronda: 4 }) } });

    await store.dispatch(plantarse({ jugadorId: 5, dados: [1, 1, 3, 4, 4], tiradas: 3 }));

    expect(api.plantarse).toHaveBeenCalledWith(12, { jugadorId: 5, ronda: 4, dados: [1, 1, 3, 4, 4], tiradas: 3 });
});

test('plantarse con 409 recarga la partida sin mostrar error', async () => {
    api.plantarse.mockRejectedValue(errorHttp(409, 'La ronda ya ha terminado'));
    api.obtenerPartida.mockResolvedValue(trasAna);
    const store = crearStore({ partida: { ...crearStore().getState().partida, estado: estadoPartida() } });

    const envio = store.dispatch(plantarse({ jugadorId: 5, ronda: 1, dados: [2, 2, 5, 5, 5], tiradas: 2 }));
    expect(store.getState().partida.enviando).toBe(true);
    await envio;

    expect(api.obtenerPartida).toHaveBeenCalledWith(12);
    const { estado, enviando, errorJugada } = store.getState().partida;
    expect(estado.turno).toBe(1);
    expect(enviando).toBe(false);
    expect(errorJugada).toBeNull();
});

test('si tras un 409 tampoco se puede recargar, se muestra ese error', async () => {
    api.plantarse.mockRejectedValue(errorHttp(409, 'No es el turno de este jugador'));
    api.obtenerPartida.mockRejectedValue(errorDeRed());
    const store = crearStore({ partida: { ...crearStore().getState().partida, estado: estadoPartida() } });

    await store.dispatch(plantarse({ jugadorId: 5, ronda: 1, dados: [2, 2, 5, 5, 5], tiradas: 2 }));

    expect(store.getState().partida.errorJugada.codigo).toBe('sinConexion');
});

test('plantarse muestra los errores de validación del servidor', async () => {
    api.plantarse.mockRejectedValue(errorHttp(400, 'En esta ronda solo se puede tirar 2 veces'));
    const store = crearStore({ partida: { ...crearStore().getState().partida, estado: trasAna } });

    await store.dispatch(plantarse({ jugadorId: 6, ronda: 1, dados: [2, 2, 5, 5, 5], tiradas: 3 }));

    expect(store.getState().partida.errorJugada).toEqual({ status: 400, codigo: null, mensaje: 'En esta ronda solo se puede tirar 2 veces' });
    expect(api.obtenerPartida).not.toHaveBeenCalled();
});

test('plantarse no se envía dos veces a la vez', async () => {
    let resolver;
    api.plantarse.mockReturnValue(new Promise(r => { resolver = r; }));
    const store = crearStore({ partida: { ...crearStore().getState().partida, estado: estadoPartida() } });
    const jugada = { jugadorId: 5, ronda: 1, dados: [2, 2, 5, 5, 5], tiradas: 2 };

    const primera = store.dispatch(plantarse(jugada));
    store.dispatch(plantarse(jugada));
    resolver({ partida: trasAna, rondaTerminada: null });
    await primera;

    expect(api.plantarse).toHaveBeenCalledTimes(1);
});

test('el resumen de ronda se guarda hasta cerrarlo', async () => {
    const rondaTerminada = {
        ronda: 1,
        perdedor: { id: 6, nombre: 'Luis', vidas: 2 },
        puntuacion: 22,
        dados: [2, 2, 3, 4, 5],
        finPartida: false,
    };
    api.plantarse.mockResolvedValue({ partida: estadoPartida({ ronda: 2 }), rondaTerminada });
    const store = crearStore({ partida: { ...crearStore().getState().partida, estado: trasAna } });

    await store.dispatch(plantarse({ jugadorId: 6, ronda: 1, dados: [2, 2, 3, 4, 5], tiradas: 2 }));
    expect(store.getState().partida.rondaTerminada).toEqual(rondaTerminada);

    store.dispatch(cerrarResumenRonda());
    expect(store.getState().partida.rondaTerminada).toBeNull();
});

test('salirDePartida olvida la partida', () => {
    localStorage.setItem('dadoOMuerte:partidaId', '12');
    const store = crearStore({ partida: { ...crearStore().getState().partida, estado: estadoPartida() } });

    store.dispatch(salirDePartida());

    expect(store.getState().partida.estado).toBeNull();
    expect(leerPartidaId()).toBeNull();
});

describe('derivados del estado', () => {
    test('quien abre la ronda tiene 3 tiradas', () => {
        expect(tiradaMaxDe(estadoPartida())).toBe(3);
        expect(tiradaMaxDe(trasAna)).toBe(2);
    });

    test('no hay jugador actual si la partida ha terminado', () => {
        const fin = estadoPartida({ finalizada: true, jugadorActual: null, perdedor: { id: 6, nombre: 'Luis' } });
        expect(jugadorActualDe(fin)).toBeNull();
        expect(claveTurnoDe(fin)).toBeNull();
    });

    test('la clave del turno combina partida, ronda y jugador', () => {
        expect(claveTurnoDe(trasAna)).toBe('12:1:6');
    });
});
