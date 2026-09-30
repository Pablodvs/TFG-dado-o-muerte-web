import Icono from './Icono';
import Mano from './Mano';

const JUGADAS = [
    { nombre: 'Escalera', detalle: '2-3-4-5-6', dados: [2, 3, 4, 5, 6] },
    { nombre: 'Repóker', detalle: 'cinco iguales', dados: [4, 4, 4, 4, 4] },
    { nombre: 'Póker', detalle: 'cuatro iguales', dados: [5, 5, 5, 5, 2] },
    { nombre: 'Trío', detalle: 'tres iguales', dados: [3, 3, 3, 6, 2] },
    { nombre: 'Pareja', detalle: 'dos iguales', dados: [6, 6, 2, 4, 5] },
];

// Resumen de las reglas en un desplegable nativo (<details>)
export default function ReglasJuego({ abierto = false }) {
    return (
        <details className="reglas" open={abierto}>
            <summary className="reglas__titulo">
                Cómo se juega
                <Icono nombre="flecha" className="reglas__flecha" />
            </summary>
            <div className="reglas__contenido">
                <ul className="reglas__lista">
                    <li>De 2 a 8 jugadores, con un solo móvil que se va pasando. Cada jugador empieza con 3 vidas.</li>
                    <li>
                        En tu turno tiras 5 dados. Entre tirada y tirada toca los dados que quieras para
                        guardarlos (o soltarlos): los guardados no se vuelven a tirar.
                    </li>
                    <li>
                        Quien abre la ronda puede tirar hasta 3 veces. Las tiradas que use son el máximo
                        para el resto de jugadores en esa ronda.
                    </li>
                    <li>Cuando te plantas, tu jugada son los 5 dados.</li>
                </ul>
                <h3 className="reglas__subtitulo">Jugadas, de mejor a peor</h3>
                <ol className="reglas__jugadas">
                    {JUGADAS.map(j => (
                        <li key={j.nombre} className="reglas__jugada">
                            <span><strong>{j.nombre}</strong>: {j.detalle}.</span>
                            <Mano dados={j.dados} decorativa />
                        </li>
                    ))}
                </ol>
                <ul className="reglas__lista">
                    <li>Con la misma jugada gana el valor más alto: un trío de 5 supera a un trío de 3.</li>
                    <li>
                        Los <strong>unos son comodines</strong>: se suman a tu grupo más numeroso (si hay empate,
                        al de mayor valor). No sirven para la escalera.
                        <span className="reglas__ejemplo">
                            <span className="solo-lectores">Por ejemplo, 1-4-4-2-6</span>
                            <Mano dados={[1, 4, 4, 2, 6]} decorativa />
                            <span>= trío de 4</span>
                        </span>
                    </li>
                    <li>
                        La peor jugada de la ronda pierde una vida. Si hay empate, pierde quien jugó después.
                        Quien pierde la vida abre la siguiente ronda.
                    </li>
                    <li>La partida acaba cuando alguien se queda sin vidas: esa persona es la perdedora.</li>
                </ul>
            </div>
        </details>
    );
}
