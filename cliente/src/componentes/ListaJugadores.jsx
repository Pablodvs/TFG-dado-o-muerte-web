import { useTranslation } from 'react-i18next';
import Icono from './Icono';

// La inicial (data-inicial) la pinta el CSS como una ficha de color
export default function ListaJugadores({ jugadores, onQuitar }) {
    const { t } = useTranslation();
    if (jugadores.length === 0) return null;
    return (
        <ol className="lista-jugadores" aria-label={t('listaJugadores.titulo')}>
            {jugadores.map(j => (
                <li key={j.id} className="lista-jugadores__jugador" data-inicial={j.nombre.charAt(0).toLocaleUpperCase('es')}>
                    <span className="lista-jugadores__nombre">{j.nombre}</span>
                    <button
                        type="button"
                        className="boton boton--icono lista-jugadores__quitar"
                        onClick={() => onQuitar(j.id)}
                        aria-label={t('listaJugadores.quitar', { nombre: j.nombre })}
                    >
                        <Icono nombre="cerrar" />
                    </button>
                </li>
            ))}
        </ol>
    );
}
