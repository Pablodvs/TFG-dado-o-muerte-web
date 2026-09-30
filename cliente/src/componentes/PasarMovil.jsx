import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icono from './Icono';
import Vidas from './Vidas';
import useArmado from '../hooks/useArmado';
import clases from '../lib/clases';
import { describirDados } from '../lib/puntuacion';
import { plural, TIRADAS_MAXIMAS } from '../lib/reglas';

// Pantalla intermedia antes de cada turno: el móvil cambia de manos.
// Ocupa toda la pantalla para que nadie vea nada hasta que el siguiente la toque.
// Se pinta en su propia capa dentro de <body> y deja inerte todo lo demás
// (cabecera incluida), así ni el ratón ni el teclado llegan a lo de debajo.
export default function PasarMovil({ jugador, abreRonda, tiradaMax, ronda, peorTirada, onEmpezar }) {
    const boton = useRef(null);
    const [capa] = useState(() => document.createElement('div'));
    // Un doble toque en la pantalla anterior no debe empezar el turno de otro.
    // No se usa disabled porque el botón tiene que poder recibir el foco.
    const armado = useArmado();

    // Antes de pintar, para que no se vea ni un fotograma sin la cortina
    useLayoutEffect(() => {
        document.body.appendChild(capa);
        const resto = [...document.body.children].filter(el => el !== capa && !el.hasAttribute('inert'));
        resto.forEach(el => el.setAttribute('inert', ''));
        // Con teclado basta con pulsar Intro para empezar
        boton.current?.focus();
        return () => {
            resto.forEach(el => el.removeAttribute('inert'));
            capa.remove();
        };
    }, [capa]);

    const detalle = abreRonda
        ? `Abres la ronda: puedes tirar hasta ${TIRADAS_MAXIMAS} veces.`
        : `Tienes ${plural(tiradaMax, 'tirada', 'tiradas')}.`;
    const aSuperar = peorTirada && describirDados(peorTirada.dados);

    return createPortal(
        <section className="pasar-movil" aria-labelledby="pasar-movil-nombre">
            <button
                ref={boton}
                type="button"
                className={clases('pasar-movil__boton', !armado && 'pasar-movil__boton--esperando')}
                onClick={armado ? onEmpezar : undefined}
                aria-disabled={!armado || undefined}
            >
                {ronda && <span className="pasar-movil__ronda">Ronda {ronda}</span>}{' '}
                <span className="pasar-movil__aviso">Turno de</span>{' '}
                <span id="pasar-movil-nombre" className="pasar-movil__nombre">{jugador.nombre}</span>{' '}
                <Vidas vidas={jugador.vidas} />{' '}
                <span className="pasar-movil__detalle">{detalle}</span>{' '}
                {aSuperar && (
                    <span className="pasar-movil__superar">
                        A superar: <strong>{aSuperar}</strong> de {peorTirada.nombre}
                    </span>
                )}{' '}
                <span className="pasar-movil__accion">
                    <Icono nombre="mano" />
                    <span className="pasar-movil__accion-texto">Toca para empezar</span>
                </span>
                <span className="pasar-movil__nota">Que no mire nadie más</span>
            </button>
        </section>,
        capa,
    );
}
