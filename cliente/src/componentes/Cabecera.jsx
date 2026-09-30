import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import SelectorIdioma from './SelectorIdioma';
import clases from '../lib/clases';

// En la portada es el gran rótulo del juego; en el resto, una barra discreta.
// El nombre del juego no se traduce.
export default function Cabecera() {
    const { t } = useTranslation();
    const portada = useLocation().pathname === '/';
    return (
        <header className={clases('cabecera', portada && 'cabecera--portada')}>
            <Link to="/" className="cabecera__marca">
                <Logo className="cabecera__logo" />
                <span className="cabecera__nombre">
                    Dado <span className="cabecera__o">o</span> muerte
                </span>
            </Link>
            {portada && <p className="cabecera__lema">{t('cabecera.lema')}</p>}
            <SelectorIdioma />
        </header>
    );
}
