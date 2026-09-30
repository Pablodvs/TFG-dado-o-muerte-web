import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import clases from '../lib/clases';

// En la portada es el gran rótulo del juego; en el resto, una barra discreta
export default function Cabecera() {
    const portada = useLocation().pathname === '/';
    return (
        <header className={clases('cabecera', portada && 'cabecera--portada')}>
            <Link to="/" className="cabecera__marca">
                <Logo className="cabecera__logo" />
                <span className="cabecera__nombre">
                    Dado <span className="cabecera__o">o</span> muerte
                </span>
            </Link>
            {portada && <p className="cabecera__lema">Cinco dados, tres vidas y un solo perdedor.</p>}
        </header>
    );
}
