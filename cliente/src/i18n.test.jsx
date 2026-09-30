import { fireEvent, render, screen } from '@testing-library/react';
import ResumenRonda from './componentes/ResumenRonda';
import i18n from './i18n';
import en from './idiomas/en.json';
import es from './idiomas/es.json';
import { renderApp } from './test-utils';

beforeEach(() => localStorage.clear());

// ['a.b', ...] sin repetir. Los arrays cuentan como una hoja, y las formas de
// plural (_one, _ordinal_few...) se quitan porque cada idioma tiene las suyas.
function claves(objeto, prefijo = '') {
    const todas = Object.entries(objeto).flatMap(([clave, valor]) => (
        valor && typeof valor === 'object' && !Array.isArray(valor)
            ? claves(valor, `${prefijo}${clave}.`)
            : [`${prefijo}${clave}`.replace(/_(ordinal_)?(zero|one|two|few|many|other)$/, '')]
    ));
    return [...new Set(todas)].sort();
}

test('todos los idiomas tienen las mismas claves', () => {
    expect(claves(en)).toEqual(claves(es));
    // Mismo número de castigos: el de cada partida no cambia con el idioma
    expect(en.final.castigos).toHaveLength(es.final.castigos.length);
});

test('el selector cambia el idioma de toda la app y lo recuerda', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'Nueva partida' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('heading', { name: 'New game' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start game' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(localStorage.getItem('dadoOMuerte:idioma')).toBe('en');
});

test('los puestos usan los ordinales de cada idioma', async () => {
    const puesto = n => i18n.t('final.puesto', { count: n, ordinal: true });
    expect([1, 2, 4].map(puesto)).toEqual(['1º', '2º', '4º']);
    await i18n.changeLanguage('en');
    expect([1, 2, 3, 4, 11, 22].map(puesto)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '22nd']);
});

test('los nombres con "<" no se confunden con etiquetas', () => {
    const resumen = {
        ronda: 1,
        perdedor: { id: 5, nombre: 'Ana <3', vidas: 2 },
        dados: [2, 2, 3, 4, 6],
        finPartida: false,
    };
    render(<ResumenRonda resumen={resumen} onContinuar={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Ana <3 pierde una vida — le quedan 2 vidas');
});

describe('idioma inicial', () => {
    let idiomas;

    beforeEach(() => {
        idiomas = jest.spyOn(navigator, 'languages', 'get');
    });

    afterEach(() => idiomas.mockRestore());

    // Carga i18n de cero, como al abrir la página
    function idiomaAlCargar() {
        let idioma;
        jest.isolateModules(() => {
            idioma = require('./i18n').default.language;
        });
        return idioma;
    }

    test('usa el primer idioma del navegador que haya, sin variante regional', () => {
        idiomas.mockReturnValue(['fr-FR', 'en-GB', 'es-ES']);
        expect(idiomaAlCargar()).toBe('en');
    });

    test('si el navegador no pide ninguno conocido, castellano', () => {
        idiomas.mockReturnValue(['fr-FR', 'de']);
        expect(idiomaAlCargar()).toBe('es');
    });

    test('lo elegido a mano manda sobre el navegador', () => {
        idiomas.mockReturnValue(['es-ES']);
        localStorage.setItem('dadoOMuerte:idioma', 'en');
        expect(idiomaAlCargar()).toBe('en');
    });
});
