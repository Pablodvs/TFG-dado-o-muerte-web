import { plural, puedenEmpezar, validarNombre } from './reglas';

describe('validarNombre', () => {
    test('acepta un nombre nuevo', () => {
        expect(validarNombre('Ana', ['Luis'])).toBeNull();
    });

    test('rechaza nombres vacíos o solo con espacios', () => {
        expect(validarNombre('', [])).toMatch(/Escribe un nombre/);
        expect(validarNombre('   ', [])).toMatch(/Escribe un nombre/);
    });

    test('recorta los espacios antes de medir la longitud', () => {
        expect(validarNombre(`  ${'a'.repeat(20)}  `, [])).toBeNull();
        expect(validarNombre('a'.repeat(21), [])).toMatch(/20 caracteres/);
    });

    test('no distingue mayúsculas al buscar repetidos', () => {
        expect(validarNombre(' ana ', ['Ana'])).toMatch(/Ya hay alguien que se llama ana/);
        expect(validarNombre('ÁLVARO', ['álvaro'])).not.toBeNull();
    });

    test('no deja pasar de 8 jugadores', () => {
        const ocho = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        expect(validarNombre('i', ocho)).toMatch(/máximo/);
    });
});

test('puedenEmpezar exige entre 2 y 8 jugadores', () => {
    expect(puedenEmpezar(['a'])).toBe(false);
    expect(puedenEmpezar(['a', 'b'])).toBe(true);
    expect(puedenEmpezar(Array.from({ length: 9 }, (_, i) => `j${i}`))).toBe(false);
});

test('plural', () => {
    expect(plural(1, 'vida', 'vidas')).toBe('1 vida');
    expect(plural(0, 'vida', 'vidas')).toBe('0 vidas');
    expect(plural(2, 'vida', 'vidas')).toBe('2 vidas');
});
