import Logo from './Logo';

export default function Cargando({ texto = 'Cargando…' }) {
    return (
        <div className="cargando">
            <Logo className="cargando__logo" />
            <p className="cargando__texto" role="status">{texto}</p>
        </div>
    );
}
