import Icono from './Icono';

// La inicial (data-inicial) la pinta el CSS como una ficha de color
export default function ListaJugadores({ jugadores, onQuitar }) {
    if (jugadores.length === 0) return null;
    return (
        <ol className="lista-jugadores" aria-label="Jugadores apuntados">
            {jugadores.map(j => (
                <li key={j.id} className="lista-jugadores__jugador" data-inicial={j.nombre.charAt(0).toLocaleUpperCase('es')}>
                    <span className="lista-jugadores__nombre">{j.nombre}</span>
                    <button
                        type="button"
                        className="boton boton--icono lista-jugadores__quitar"
                        onClick={() => onQuitar(j.id)}
                        aria-label={`Quitar a ${j.nombre}`}
                    >
                        <Icono nombre="cerrar" />
                    </button>
                </li>
            ))}
        </ol>
    );
}
