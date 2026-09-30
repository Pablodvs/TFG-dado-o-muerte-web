import { Trans, useTranslation } from 'react-i18next';
import Icono from './Icono';
import Mano from './Mano';
import Vidas from './Vidas';
import useArmado from '../hooks/useArmado';
import clases from '../lib/clases';
import { describirDados } from '../lib/puntuacion';

// resumen: RondaTerminada del servidor
export default function ResumenRonda({ resumen, onContinuar }) {
    const { t } = useTranslation();
    const { ronda, perdedor, dados, finPartida } = resumen;
    // Un doble toque en "Plantarse" (mismo sitio) no debe saltarse el resumen
    const armado = useArmado();
    const quedan = perdedor.vidas > 0
        ? t('resumenRonda.quedan', { count: perdedor.vidas })
        : t('resumenRonda.sinVidas');

    return (
        <section
            className={clases('resumen-ronda', finPartida && 'resumen-ronda--fin')}
            aria-labelledby="resumen-ronda-titulo"
        >
            <h2 id="resumen-ronda-titulo" className="resumen-ronda__titulo">{t('resumenRonda.titulo', { ronda })}</h2>
            <Icono nombre="calavera" className="resumen-ronda__calavera" />
            <p className="resumen-ronda__perdedor" role="status">
                <Trans i18nKey="resumenRonda.pierde">
                    <strong className="resumen-ronda__nombre">{{ nombre: perdedor.nombre }}</strong>
                </Trans>
                <span className="resumen-ronda__guion"> — </span>
                <span className="resumen-ronda__quedan">{quedan}</span>
            </p>
            <Vidas vidas={perdedor.vidas} recienPerdida />
            <div className="resumen-ronda__jugada">
                <span className="resumen-ronda__etiqueta">
                    <Trans i18nKey="resumenRonda.con">
                        <strong>{{ jugada: describirDados(dados) }}</strong>
                    </Trans>
                </span>
                <Mano dados={dados} tamano="mediano" />
            </div>
            {!finPartida && (
                <p className="resumen-ronda__siguiente">
                    {t('resumenRonda.siguiente', { nombre: perdedor.nombre, ronda: ronda + 1 })}
                </p>
            )}
            <div className="resumen-ronda__acciones">
                <button
                    type="button"
                    className={clases('boton boton--principal resumen-ronda__continuar', !armado && 'boton--armando')}
                    onClick={armado ? onContinuar : undefined}
                    aria-disabled={!armado || undefined}
                >
                    {t(finPartida ? 'resumenRonda.verResultado' : 'resumenRonda.siguienteRonda')}
                    <Icono nombre="flecha" />
                </button>
            </div>
        </section>
    );
}
