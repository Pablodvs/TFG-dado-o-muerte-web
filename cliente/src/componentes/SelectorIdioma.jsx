import { useTranslation } from 'react-i18next';
import { cambiarIdioma, IDIOMAS } from '../i18n';

// Botones "ES · EN". Cada uno se anuncia con el nombre del idioma en ese idioma.
export default function SelectorIdioma() {
    const { t, i18n } = useTranslation();
    return (
        <div className="idioma" role="group" aria-label={t('idioma.etiqueta')}>
            {IDIOMAS.map(({ codigo, nombre }) => (
                <button
                    key={codigo}
                    type="button"
                    className="idioma__opcion"
                    lang={codigo}
                    aria-label={nombre}
                    title={nombre}
                    aria-pressed={i18n.resolvedLanguage === codigo}
                    onClick={() => cambiarIdioma(codigo)}
                >
                    {codigo.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
