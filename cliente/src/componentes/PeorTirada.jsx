import Icono from './Icono';
import Mano from './Mano';
import clases from '../lib/clases';
import { describirDados } from '../lib/puntuacion';

// La jugada que va perdiendo la ronda: hay que superarla (empatar no basta)
export default function PeorTirada({ peorTirada }) {
    return (
        <section
            className={clases('peor-tirada', !peorTirada && 'peor-tirada--vacia')}
            aria-labelledby="peor-tirada-titulo"
        >
            <Icono nombre="calavera" className="peor-tirada__icono" />
            <div className="peor-tirada__cuerpo">
                <h2 id="peor-tirada-titulo" className="peor-tirada__titulo">Tirada a superar</h2>
                {peorTirada ? (
                    <>
                        <p className="peor-tirada__detalle">
                            <span className="peor-tirada__nombre">{peorTirada.nombre}</span>:{' '}
                            <strong className="peor-tirada__jugada">
                                {describirDados(peorTirada.dados) ?? `${peorTirada.puntuacion} puntos`}
                            </strong>
                        </p>
                        <p className="peor-tirada__nota">Si empatas, pierdes tú.</p>
                    </>
                ) : (
                    <p className="peor-tirada__vacia">Nadie ha jugado todavía en esta ronda.</p>
                )}
            </div>
            {peorTirada && <Mano dados={peorTirada.dados} className="peor-tirada__dados" />}
        </section>
    );
}
