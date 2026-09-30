import {
    borrarPartidaId,
    claveTurno,
    guardarPartidaId,
    guardarTurno,
    leerPartidaId,
    leerTurno,
} from './almacen';

const dados = [2, 2, 5, 5, 5].map((valor, i) => ({ valor, guardado: i < 2 }));

beforeEach(() => localStorage.clear());

test('guarda y lee el id de la partida como número', () => {
    expect(leerPartidaId()).toBeNull();
    guardarPartidaId(12);
    expect(leerPartidaId()).toBe(12);
    borrarPartidaId();
    expect(leerPartidaId()).toBeNull();
});

test('ignora ids que no son enteros positivos', () => {
    localStorage.setItem('dadoOMuerte:partidaId', 'abc');
    expect(leerPartidaId()).toBeNull();
});

test('recupera el turno solo con la misma clave', () => {
    const clave = claveTurno(12, 1, 5);
    guardarTurno(clave, { dados, tirada: 2 });
    expect(leerTurno(clave)).toEqual({ dados, tirada: 2 });
    expect(leerTurno(claveTurno(12, 2, 5))).toBeNull();
    expect(leerTurno(claveTurno(12, 1, 6))).toBeNull();
});

test('descarta turnos guardados con datos inválidos', () => {
    const clave = claveTurno(12, 1, 5);
    guardarTurno(clave, { dados: dados.slice(0, 4), tirada: 1 });
    expect(leerTurno(clave)).toBeNull();
    guardarTurno(clave, { dados, tirada: 0 });
    expect(leerTurno(clave)).toBeNull();
    localStorage.setItem('dadoOMuerte:turno', '{no es json');
    expect(leerTurno(clave)).toBeNull();
});

test('cambiar o borrar la partida borra el turno guardado', () => {
    const clave = claveTurno(12, 1, 5);
    guardarTurno(clave, { dados, tirada: 1 });
    guardarPartidaId(13);
    expect(leerTurno(clave)).toBeNull();

    guardarTurno(clave, { dados, tirada: 1 });
    borrarPartidaId();
    expect(leerTurno(clave)).toBeNull();
});
