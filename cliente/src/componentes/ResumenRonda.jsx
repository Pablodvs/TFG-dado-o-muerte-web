import Icono from './Icono';
import Mano from './Mano';
import Vidas from './Vidas';
import useArmado from '../hooks/useArmado';
import clases from '../lib/clases';
import { describirDados } from '../lib/puntuacion';
import { plural } from '../lib/reglas';

// resumen: RondaTerminada del servidor
export default function ResumenRonda({ resumen, onContinuar }) {
    const { ronda, perdedor, dados, finPartida } = resumen;
    // Un doble toque en "Plantarse" (mismo sitio) no debe saltarse el resumen
    const armado = useArmado();
    const quedan = perdedor.vidas > 0
        ? `le ${perdedor.vidas === 1 ? 'queda' : 'quedan'} ${plural(perdedor.vidas, 'vida', 'vidas')}`
        : 'se queda sin vidas';

    return (
        <section
            className={clases('resumen-ronda', finPartida && 'resumen-ronda--fin')}
            aria-labelledby="resumen-ronda-titulo"
        >
            <h2 id="resumen-ronda-titulo" className="resumen-ronda__titulo">Fin de la ronda {ronda}</h2>
            <Icono nombre="calavera" className="resumen-ronda__calavera" />
            <p className="resumen-ronda__perdedor" role="status">
                <strong className="resumen-ronda__nombre">{perdedor.nombre}</strong> pierde una vida
                <span className="resumen-ronda__guion"> — </span>
                <span className="resumen-ronda__quedan">{quedan}</span>
            </p>
            <Vidas vidas={perdedor.vidas} recienPerdida />
            <div className="resumen-ronda__jugada">
                <span className="resumen-ronda__etiqueta">
                    Con <strong>{describirDados(dados)}</strong>
                </span>
                <Mano dados={dados} tamano="mediano" />
            </div>
            {!finPartida && (
                <p className="resumen-ronda__siguiente">{perdedor.nombre} abre la ronda {ronda + 1}.</p>
            )}
            <div className="resumen-ronda__acciones">
                <button
                    type="button"
                    className={clases('boton boton--principal resumen-ronda__continuar', !armado && 'boton--armando')}
                    onClick={armado ? onContinuar : undefined}
                    aria-disabled={!armado || undefined}
                >
                    {finPartida ? 'Ver resultado final' : 'Siguiente ronda'}
                    <Icono nombre="flecha" />
                </button>
            </div>
        </section>
    );
}
