import { puedenEmpezar, validarNombre } from './reglas';

describe('validarNombre', () => {
    test('acepta un nombre nuevo', () => {
        expect(validarNombre('Ana', ['Luis'])).toBeNull();
    });

    test('rechaza nombres vacíos o solo con espacios', () => {
        expect(validarNombre('', [])).toBe('vacio');
        expect(validarNombre('   ', [])).toBe('vacio');
    });

    test('recorta los espacios antes de medir la longitud', () => {
        expect(validarNombre(`  ${'a'.repeat(20)}  `, [])).toBeNull();
        expect(validarNombre('a'.repeat(21), [])).toBe('largo');
    });

    test('no distingue mayúsculas al buscar repetidos', () => {
        expect(validarNombre(' ana ', ['Ana'])).toBe('repetido');
        expect(validarNombre('ÁLVARO', ['álvaro'])).toBe('repetido');
    });

    test('no deja pasar de 8 jugadores', () => {
        const ocho = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        expect(validarNombre('i', ocho)).toBe('mesaCompleta');
    });
});

test('puedenEmpezar exige entre 2 y 8 jugadores', () => {
    expect(puedenEmpezar(['a'])).toBe(false);
    expect(puedenEmpezar(['a', 'b'])).toBe(true);
    expect(puedenEmpezar(Array.from({ length: 9 }, (_, i) => `j${i}`))).toBe(false);
});
