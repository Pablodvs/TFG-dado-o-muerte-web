import { Trans, useTranslation } from 'react-i18next';
import Dado from './Dado';
import Icono from './Icono';
import JugadaActual from './JugadaActual';
import Vidas from './Vidas';
import useTurno from '../hooks/useTurno';
import { textoError } from '../api';
import clases from '../lib/clases';

function claveAyuda({ tirada, tiradaMax, rodando, todosGuardados }) {
    if (rodando) return 'rodando';
    if (tirada === 0) return 'empezar';
    if (tirada >= tiradaMax) return 'sinTiradas';
    if (todosGuardados) return 'todosGuardados';
    return 'guardar';
}

// El turno de un jugador. Montar con key={clave} para empezar de cero en cada turno.
// onPlantarse({ dados, tiradas })
export default function Turno({ clave, jugador, tiradaMax, peorTirada, enviando, error, onPlantarse }) {
    const { t } = useTranslation();
    const turno = useTurno(clave, tiradaMax);
    const { dados, tirada, rodando } = turno;
    // Cuando ya no se puede tirar, plantarse pasa a ser la acción principal
    const tocaPlantarse = tirada > 0 && !turno.puedeTirar && !rodando;

    return (
        <section className="turno" aria-labelledby="turno-titulo">
            <header className="turno__cabecera">
                <div className="turno__quien">
                    <h2 id="turno-titulo" className="turno__jugador">
                        <span className="turno__prefijo">{t('turno.prefijo')}</span>
                        <span className="turno__nombre">{jugador.nombre}</span>
                    </h2>
                    <Vidas vidas={jugador.vidas} />
                </div>
                <div className="turno__contador">
                    <p className="turno__tiradas">
                        <Trans i18nKey="turno.tirada">
                            <span className="turno__tirada">{{ tirada }}</span>
                            <span className="turno__tirada-max">{{ tiradaMax }}</span>
                        </Trans>
                    </p>
                    <span className="turno__marcas" aria-hidden="true">
                        {Array.from({ length: tiradaMax }, (_, i) => (
                            <span key={i} className={clases('turno__marca', i < tirada && 'turno__marca--usada')} />
                        ))}
                    </span>
                </div>
            </header>

            <ul className="turno__dados" aria-label={t('turno.dados')}>
                {dados.map((dado, i) => (
                    <li key={i} className="turno__dado">
                        <Dado
                            valor={dado.valor}
                            guardado={dado.guardado}
                            rodando={rodando && !dado.guardado}
                            onClick={() => turno.alternarGuardado(i)}
                            disabled={!turno.puedeGuardar || enviando}
                            tamano="grande"
                        />
                    </li>
                ))}
            </ul>

            <p className="turno__ayuda">{t(`turno.ayuda.${claveAyuda(turno)}`)}</p>
            <div className="turno__jugada">
                {turno.jugada
                    ? <JugadaActual jugada={turno.jugada} peorTirada={peorTirada} />
                    : <p className="jugada-actual jugada-actual--vacia">{t('turno.sinJugada')}</p>}
            </div>

            {error && (
                <p className="turno__error" role="alert">
                    <Icono nombre="alerta" />
                    {textoError(t, error)}
                </p>
            )}

            <div className="turno__acciones">
                <button
                    type="button"
                    className={clases('boton', tocaPlantarse ? 'boton--secundario' : 'boton--principal', 'turno__tirar')}
                    onClick={turno.tirar}
                    disabled={!turno.puedeTirar || enviando}
                >
                    <Icono nombre="tirar" />
                    {t(tirada === 0 ? 'turno.tirar' : 'turno.volverATirar')}
                </button>
                <button
                    type="button"
                    className={clases('boton', tocaPlantarse ? 'boton--principal' : 'boton--secundario', 'turno__plantarse')}
                    onClick={() => onPlantarse({ dados: turno.valores, tiradas: tirada })}
                    disabled={!turno.puedePlantarse || enviando}
                >
                    {t(enviando ? 'turno.enviando' : 'turno.plantarse')}
                </button>
            </div>
        </section>
    );
}
