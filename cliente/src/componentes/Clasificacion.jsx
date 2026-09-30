import Icono from './Icono';
import Vidas from './Vidas';
import clases from '../lib/clases';

// Jugadores ordenados por vidas restantes. Con las mismas vidas se comparte
// puesto (1, 2, 2, 4): value en el <li> numera la lista y el CSS lo enseña,
// porque el primer hijo de cada fila tiene que ser el nombre.
export default function Clasificacion({ jugadores, perdedorId }) {
    const ordenados = [...jugadores].sort((a, b) => b.vidas - a.vidas);
    const puesto = jugador => 1 + ordenados.filter(o => o.vidas > jugador.vidas).length;
    return (
        <ol className="clasificacion">
            {ordenados.map(jugador => {
                const pierde = jugador.id === perdedorId;
                return (
                    <li
                        key={jugador.id}
                        value={puesto(jugador)}
                        className={clases('clasificacion__jugador', pierde && 'clasificacion__jugador--perdedor')}
                    >
                        <span className="clasificacion__nombre">{jugador.nombre}</span>
                        {pierde && (
                            <span className="clasificacion__etiqueta">
                                <Icono nombre="calavera" />
                                Pierde
                            </span>
                        )}
                        <Vidas vidas={jugador.vidas} />
                    </li>
                );
            })}
        </ol>
    );
}
