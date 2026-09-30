import { useTranslation } from 'react-i18next';
import Icono from './Icono';
import Vidas from './Vidas';
import clases from '../lib/clases';

// Jugadores ordenados por vidas restantes. Con las mismas vidas se comparte
// puesto (1, 2, 2, 4): value en el <li> numera la lista y el CSS enseña
// data-puesto (el ordinal en el idioma actual: "2º", "2nd"), porque el primer
// hijo de cada fila tiene que ser el nombre.
export default function Clasificacion({ jugadores, perdedorId }) {
    const { t } = useTranslation();
    const ordenados = [...jugadores].sort((a, b) => b.vidas - a.vidas);
    const puesto = jugador => 1 + ordenados.filter(o => o.vidas > jugador.vidas).length;
    return (
        <ol className="clasificacion">
            {ordenados.map(jugador => {
                const pierde = jugador.id === perdedorId;
                const n = puesto(jugador);
                return (
                    <li
                        key={jugador.id}
                        value={n}
                        data-puesto={t('final.puesto', { count: n, ordinal: true })}
                        className={clases('clasificacion__jugador', pierde && 'clasificacion__jugador--perdedor')}
                    >
                        <span className="clasificacion__nombre">{jugador.nombre}</span>
                        {pierde && (
                            <span className="clasificacion__etiqueta">
                                <Icono nombre="calavera" />
                                {t('final.pierdeEtiqueta')}
                            </span>
                        )}
                        <Vidas vidas={jugador.vidas} />
                    </li>
                );
            })}
        </ol>
    );
}
