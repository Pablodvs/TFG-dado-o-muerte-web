import { describirDados, describirJugada, esTiradaValida, puntuar } from './puntuacion';

describe('puntuar', () => {
    test.each([
        [[1, 2, 2, 5, 6], 32],
        [[1, 1, 1, 4, 5], 45],
        [[2, 2, 2, 4, 4], 32],
        [[1, 1, 3, 4, 4], 44],
        [[2, 3, 4, 5, 6], 60],
        [[1, 2, 3, 4, 5], 25],
        [[1, 1, 1, 1, 1], 56],
        [[6, 6, 6, 6, 6], 56],
        [[1, 2, 3, 4, 6], 26],
        [[2, 2, 3, 3, 4], 23],
        [[3, 3, 2, 2, 4], 23],
    ])('%j → %i (ejemplos del contrato)', (dados, esperado) => {
        expect(puntuar(dados).puntuacion).toBe(esperado);
    });

    test('la escalera devuelve el resultado completo', () => {
        expect(puntuar([6, 4, 2, 5, 3])).toEqual({ puntuacion: 60, tipo: 'escalera', cantidad: 5, valor: null });
    });

    test('los comodines no sirven para la escalera', () => {
        expect(puntuar([1, 3, 4, 5, 6])).toEqual({ puntuacion: 26, tipo: 'grupo', cantidad: 2, valor: 6 });
    });

    test('cinco comodines son un repóker de 6', () => {
        expect(puntuar([1, 1, 1, 1, 1])).toEqual({ puntuacion: 56, tipo: 'grupo', cantidad: 5, valor: 6 });
    });

    test('los comodines se suman al grupo más numeroso', () => {
        expect(puntuar([1, 2, 2, 5, 6])).toEqual({ puntuacion: 32, tipo: 'grupo', cantidad: 3, valor: 2 });
        expect(puntuar([1, 1, 1, 4, 5])).toEqual({ puntuacion: 45, tipo: 'grupo', cantidad: 4, valor: 5 });
    });

    test('a igual cantidad gana el valor más alto', () => {
        expect(puntuar([2, 2, 3, 3, 4])).toEqual({ puntuacion: 23, tipo: 'grupo', cantidad: 2, valor: 3 });
    });

    test('no modifica la entrada', () => {
        const dados = [6, 5, 4, 3, 2];
        const copia = Object.freeze([...dados]);
        puntuar(copia);
        expect(copia).toEqual(dados);
    });

    test.each([
        [[1, 2, 3, 4]],
        [[1, 2, 3, 4, 5, 6]],
        [[0, 2, 3, 4, 5]],
        [[7, 2, 3, 4, 5]],
        [[1.5, 2, 3, 4, 5]],
        [null],
    ])('rechaza tiradas inválidas: %j', (dados) => {
        expect(esTiradaValida(dados)).toBe(false);
        expect(() => puntuar(dados)).toThrow(RangeError);
    });
});

describe('describirJugada', () => {
    test.each([
        [[2, 3, 4, 5, 6], 'Escalera'],
        [[1, 2, 3, 4, 6], 'Pareja de 6'],
        [[2, 2, 3, 3, 4], 'Pareja de 3'],
        [[1, 2, 2, 5, 6], 'Trío de 2'],
        [[1, 1, 3, 4, 4], 'Póker de 4'],
        [[1, 1, 1, 4, 5], 'Póker de 5'],
        [[6, 6, 6, 6, 6], 'Repóker de 6'],
        [[1, 1, 1, 1, 1], 'Repóker de 6'],
    ])('%j → "%s"', (dados, etiqueta) => {
        expect(describirDados(dados)).toBe(etiqueta);
    });

    test('describirDados devuelve null con una tirada inválida', () => {
        expect(describirDados(null)).toBeNull();
        expect(describirDados([1, 2, 3])).toBeNull();
    });

    test('acepta directamente el resultado de puntuar', () => {
        expect(describirJugada({ puntuacion: 35, tipo: 'grupo', cantidad: 3, valor: 5 })).toBe('Trío de 5');
        expect(describirJugada({ puntuacion: 60, tipo: 'escalera', cantidad: 5, valor: null })).toBe('Escalera');
    });
});
