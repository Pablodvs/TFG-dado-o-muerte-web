// El cliente puntúa por su cuenta para enseñar "Llevas: …" y "Tirada a superar" mientras se
// juega; si se separa del servidor, la pantalla dice una cosa y la ronda acaba de otra.
// Aquí se comparan las dos implementaciones con las 7776 manos posibles.
import { describirDados, describirJugada, puntuar } from './puntuacion';

const servidor = require('../../../servidor/puntuacion');

function todasLasManos() {
    const manos = [];
    for (let n = 0; n < 6 ** 5; n++) {
        const mano = [];
        for (let i = 0, resto = n; i < 5; i++, resto = Math.floor(resto / 6)) mano.push((resto % 6) + 1);
        manos.push(mano);
    }
    return manos;
}

test('el cliente puntúa igual que el servidor las 7776 manos posibles', () => {
    const distintas = todasLasManos().filter(
        dados => JSON.stringify(puntuar(dados)) !== JSON.stringify(servidor.puntuar(dados)),
    );
    expect(distintas).toEqual([]);
});

test('el nombre de cada jugada corresponde a su puntuación', () => {
    const nombres = new Map();
    for (const dados of todasLasManos()) {
        const { puntuacion } = servidor.puntuar(dados);
        const nombre = describirJugada(puntuar(dados));
        if (!nombres.has(puntuacion)) nombres.set(puntuacion, nombre);
        expect([dados, nombre]).toEqual([dados, nombres.get(puntuacion)]);
    }
    expect(nombres.get(60)).toBe('Escalera');
    expect(nombres.get(45)).toBe('Póker de 5');
    expect(nombres.get(22)).toBe('Pareja de 2');
});

describe('ronda 1: j4 abre y j5 le empata', () => {
    test('j4 [5,5,3,5,1] y j5 [1,3,5,1,5] son los dos póker de 5', () => {
        expect(describirDados([5, 5, 3, 5, 1])).toBe('Póker de 5');
        expect(describirDados([1, 3, 5, 1, 5])).toBe('Póker de 5');
        expect(puntuar([5, 5, 3, 5, 1]).puntuacion).toBe(puntuar([1, 3, 5, 1, 5]).puntuacion);
    });
});
