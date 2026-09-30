import {
    borrarPartidaId,
    claveTurno,
    guardarPartidaId,
    guardarTurno,
    leerPartidaId,
    leerTurno,
} from './almacen';
import { ID_PARTIDA, OTRA_PARTIDA } from '../test-utils';

const dados = [2, 2, 5, 5, 5].map((valor, i) => ({ valor, guardado: i < 2 }));

beforeEach(() => localStorage.clear());

test('guarda y lee el id público de la partida', () => {
    expect(leerPartidaId()).toBeNull();
    guardarPartidaId(ID_PARTIDA);
    expect(leerPartidaId()).toBe(ID_PARTIDA);
    borrarPartidaId();
    expect(leerPartidaId()).toBeNull();
});

test('ignora ids con otro formato, como los numéricos de versiones anteriores', () => {
    for (const id of ['abc', '12', `${ID_PARTIDA}x`, 'k3Vq9mTz2LpR8wNa1bC0d!']) {
        localStorage.setItem('dadoOMuerte:partidaId', id);
        expect(leerPartidaId()).toBeNull();
    }
});

test('recupera el turno solo con la misma clave', () => {
    const clave = claveTurno(ID_PARTIDA, 1, 5);
    guardarTurno(clave, { dados, tirada: 2 });
    expect(leerTurno(clave)).toEqual({ dados, tirada: 2 });
    expect(leerTurno(claveTurno(ID_PARTIDA, 2, 5))).toBeNull();
    expect(leerTurno(claveTurno(ID_PARTIDA, 1, 6))).toBeNull();
});

test('descarta turnos guardados con datos inválidos', () => {
    const clave = claveTurno(ID_PARTIDA, 1, 5);
    guardarTurno(clave, { dados: dados.slice(0, 4), tirada: 1 });
    expect(leerTurno(clave)).toBeNull();
    guardarTurno(clave, { dados, tirada: 0 });
    expect(leerTurno(clave)).toBeNull();
    localStorage.setItem('dadoOMuerte:turno', '{no es json');
    expect(leerTurno(clave)).toBeNull();
});

test('cambiar o borrar la partida borra el turno guardado', () => {
    const clave = claveTurno(ID_PARTIDA, 1, 5);
    guardarTurno(clave, { dados, tirada: 1 });
    guardarPartidaId(OTRA_PARTIDA);
    expect(leerTurno(clave)).toBeNull();

    guardarTurno(clave, { dados, tirada: 1 });
    borrarPartidaId();
    expect(leerTurno(clave)).toBeNull();
});
