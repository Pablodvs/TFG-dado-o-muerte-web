// Traducciones con i18next. Los textos están en src/idiomas/<idioma>.json. El
// castellano es el idioma en que se escribieron; la app sale en inglés salvo que
// se elija otro, y el inglés es también el de reserva si falta alguna clave.
//
// Frases con formato (<Trans>): las etiquetas <0>, <1>... son los hijos del
// <Trans> por orden, y los valores se pasan como objetos hijos ({{ nombre }}).
// Así se interpolan después de analizar las etiquetas y un nombre con "<" no
// rompe nada.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './idiomas/en.json';
import es from './idiomas/es.json';
import { guardarIdioma, leerIdioma } from './lib/almacen';

// nombre: en su propio idioma, que es como lo busca quien no entiende el actual
export const IDIOMAS = [
    { codigo: 'es', nombre: 'Español' },
    { codigo: 'en', nombre: 'English' },
];

const IDIOMA_POR_DEFECTO = 'en';

// El elegido a mano si es uno que tenemos; si no, el inglés (no se mira el del navegador)
function idiomaInicial() {
    const guardado = leerIdioma();
    return IDIOMAS.some(i => i.codigo === guardado) ? guardado : IDIOMA_POR_DEFECTO;
}

// Para lectores de pantalla, traductores automáticos y guiones (hyphens: auto)
i18n.on('languageChanged', (idioma) => {
    document.documentElement.lang = idioma;
});

i18n.use(initReactI18next).init({
    resources: {
        es: { translation: es },
        en: { translation: en },
    },
    lng: idiomaInicial(),
    fallbackLng: IDIOMA_POR_DEFECTO,
    supportedLngs: IDIOMAS.map(i => i.codigo),
    // Los recursos ya están cargados: así el primer render sale traducido
    initImmediate: false,
    // React ya escapa el texto
    interpolation: { escapeValue: false },
});

export function cambiarIdioma(codigo) {
    guardarIdioma(codigo);
    return i18n.changeLanguage(codigo);
}

export default i18n;
