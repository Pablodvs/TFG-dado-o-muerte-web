import axios from 'axios';
import { crearPartida, describirError, obtenerPartida, plantarse } from './api';
import { errorDeRed, errorHttp, estadoPartida } from './test-utils';

jest.mock('axios', () => {
    const instancia = { get: jest.fn(), post: jest.fn() };
    return { create: jest.fn(() => instancia), instancia };
});

const { instancia } = axios;

test('plantarse envía jugadorId, ronda, dados y tiradas', async () => {
    instancia.post.mockResolvedValue({ data: { partida: estadoPartida(), rondaTerminada: null } });

    const resultado = await plantarse(12, { jugadorId: 5, ronda: 3, dados: [2, 2, 5, 5, 5], tiradas: 2 });

    expect(instancia.post).toHaveBeenCalledWith('/api/partidas/12/plantarse', {
        jugadorId: 5,
        ronda: 3,
        dados: [2, 2, 5, 5, 5],
        tiradas: 2,
    });
    expect(resultado).toEqual({ partida: estadoPartida(), rondaTerminada: null });
});

test('crearPartida envía los nombres y devuelve la partida', async () => {
    instancia.post.mockResolvedValue({ data: { partida: estadoPartida() } });

    await expect(crearPartida(['Ana', 'Luis'])).resolves.toEqual(estadoPartida());
    expect(instancia.post).toHaveBeenCalledWith('/api/partidas', { jugadores: ['Ana', 'Luis'] });
});

test('una respuesta que no es un EstadoPartida se trata como fallo de conexión', async () => {
    instancia.get.mockResolvedValue({ data: '<!doctype html>' });

    const error = await obtenerPartida(12).catch(e => e);

    expect(describirError(error)).toEqual({ status: null, mensaje: expect.stringMatching(/inesperado/) });
});

test('describirError usa el mensaje del servidor y cubre la falta de conexión', () => {
    expect(describirError(errorHttp(409, 'La ronda ya ha terminado')))
        .toEqual({ status: 409, mensaje: 'La ronda ya ha terminado' });
    expect(describirError(errorHttp(502)).mensaje).toMatch(/no está disponible/);
    expect(describirError(errorDeRed())).toEqual({ status: null, mensaje: expect.stringMatching(/No se puede conectar/) });
});
