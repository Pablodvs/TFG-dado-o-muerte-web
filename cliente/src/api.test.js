import axios from 'axios';
import { crearPartida, describirError, obtenerPartida, plantarse, textoError } from './api';
import i18n from './i18n';
import { errorDeRed, errorHttp, estadoPartida } from './test-utils';

vi.mock('axios', () => {
    const instancia = { get: vi.fn(), post: vi.fn() };
    return { default: { create: vi.fn(() => instancia), instancia } };
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

    expect(describirError(error)).toEqual({ status: null, codigo: 'respuestaInesperada', mensaje: null });
});

test('describirError usa el código del servidor y cubre la falta de conexión', () => {
    expect(describirError(errorHttp(409, 'La ronda ya ha terminado', 'rondaTerminada'))).toEqual({ status: 409, codigo: 'rondaTerminada', mensaje: 'La ronda ya ha terminado' });
    // Sin código: el texto del servidor, o uno según el estado
    expect(describirError(errorHttp(400, 'Nombres no válidos'))).toEqual({ status: 400, codigo: null, mensaje: 'Nombres no válidos' });
    expect(describirError(errorHttp(502))).toEqual({ status: 502, codigo: 'servidorCaido', mensaje: null });
    expect(describirError(errorHttp(404))).toEqual({ status: 404, codigo: 'noExiste', mensaje: null });
    expect(describirError(errorDeRed())).toEqual({ status: null, codigo: 'sinConexion', mensaje: null });
});

test('textoError traduce el código y, si no lo conoce, usa el texto del servidor', async () => {
    const t = i18n.t.bind(i18n);
    expect(textoError(t, { codigo: 'sinConexion', mensaje: null })).toMatch(/No se puede conectar/);
    expect(textoError(t, { codigo: 'rondaTerminada', mensaje: 'x' })).toBe('La ronda ya ha terminado.');
    expect(textoError(t, { codigo: 'deUnServidorMasNuevo', mensaje: 'Texto del servidor' })).toBe('Texto del servidor');
    expect(textoError(t, { codigo: null, mensaje: 'Nombres no válidos' })).toBe('Nombres no válidos');
    expect(textoError(t, { codigo: null, mensaje: null })).toMatch(/error inesperado/);

    await i18n.changeLanguage('en');
    expect(textoError(t, { codigo: 'rondaTerminada', mensaje: 'La ronda ya ha terminado' })).toBe('The round is already over.');
});
