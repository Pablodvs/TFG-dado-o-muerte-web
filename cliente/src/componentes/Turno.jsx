import Dado from './Dado';
import Icono from './Icono';
import JugadaActual from './JugadaActual';
import Vidas from './Vidas';
import useTurno from '../hooks/useTurno';
import clases from '../lib/clases';

function textoAyuda({ tirada, tiradaMax, rodando, todosGuardados }) {
    if (rodando) return 'Tirando…';
    if (tirada === 0) return 'Tira los dados para empezar.';
    if (tirada >= tiradaMax) return 'No te quedan tiradas: plántate.';
    if (todosGuardados) return 'Has guardado todos los dados: suelta alguno para volver a tirar, o plántate.';
    return 'Toca un dado para guardarlo o soltarlo. Los guardados no se vuelven a tirar.';
}

// El turno de un jugador. Montar con key={clave} para empezar de cero en cada turno.
// onPlantarse({ dados, tiradas })
export default function Turno({ clave, jugador, tiradaMax, peorTirada, enviando, error, onPlantarse }) {
    const turno = useTurno(clave, tiradaMax);
    const { dados, tirada, rodando } = turno;
    // Cuando ya no se puede tirar, plantarse pasa a ser la acción principal
    const tocaPlantarse = tirada > 0 && !turno.puedeTirar && !rodando;

    return (
        <section className="turno" aria-labelledby="turno-titulo">
            <header className="turno__cabecera">
                <div className="turno__quien">
                    <h2 id="turno-titulo" className="turno__jugador">
                        <span className="turno__prefijo">Turno de </span>
                        <span className="turno__nombre">{jugador.nombre}</span>
                    </h2>
                    <Vidas vidas={jugador.vidas} />
                </div>
                <div className="turno__contador">
                    <p className="turno__tiradas">
                        Tirada <span className="turno__tirada">{tirada}</span>/
                        <span className="turno__tirada-max">{tiradaMax}</span>
                    </p>
                    <span className="turno__marcas" aria-hidden="true">
                        {Array.from({ length: tiradaMax }, (_, i) => (
                            <span key={i} className={clases('turno__marca', i < tirada && 'turno__marca--usada')} />
                        ))}
                    </span>
                </div>
            </header>

            <ul className="turno__dados" aria-label="Tus dados">
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

            <p className="turno__ayuda">{textoAyuda(turno)}</p>
            <div className="turno__jugada">
                {turno.jugada
                    ? <JugadaActual jugada={turno.jugada} peorTirada={peorTirada} />
                    : <p className="jugada-actual jugada-actual--vacia">Aquí verás tu jugada</p>}
            </div>

            {error && (
                <p className="turno__error" role="alert">
                    <Icono nombre="alerta" />
                    {error.mensaje}
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
                    {tirada === 0 ? 'Tirar dados' : 'Volver a tirar'}
                </button>
                <button
                    type="button"
                    className={clases('boton', tocaPlantarse ? 'boton--principal' : 'boton--secundario', 'turno__plantarse')}
                    onClick={() => onPlantarse({ dados: turno.valores, tiradas: tirada })}
                    disabled={!turno.puedePlantarse || enviando}
                >
                    {enviando ? 'Enviando…' : 'Plantarse'}
                </button>
            </div>
        </section>
    );
}
