import { render, screen } from '@testing-library/react';
import { puntuar } from '../lib/puntuacion';
import JugadaActual from './JugadaActual';

// Peor tirada de la ronda tal como la manda el servidor
const peorDeJ4 = { jugadorId: 1, nombre: 'j4', puntuacion: 45, dados: [5, 5, 3, 5, 1] };

function jugadaActual(dados, peorTirada = peorDeJ4) {
    render(<JugadaActual jugada={puntuar(dados)} peorTirada={peorTirada} />);
    return screen.getByText('Llevas:').closest('p');
}

test('ronda 1: j5 con [1,3,5,1,5] empata con j4 y, como juega después, sería la peor tirada', () => {
    const jugada = jugadaActual([1, 3, 5, 1, 5]);
    expect(jugada).toHaveTextContent('Llevas: Póker de 5 · Ahora mismo serías la peor tirada');
    expect(jugada).toHaveClass('jugada-actual--peligro');
});

test('superar la peor tirada por un punto basta para salvarse', () => {
    const jugada = jugadaActual([6, 6, 6, 1, 2]); // póker de 6: 46
    expect(jugada).toHaveTextContent('Llevas: Póker de 6 · Superas la peor tirada');
    expect(jugada).toHaveClass('jugada-actual--a-salvo');
});

test('una jugada peor que la tirada a superar está en peligro', () => {
    const jugada = jugadaActual([5, 5, 5, 3, 2]); // trío de 5: 35
    expect(jugada).toHaveTextContent('Llevas: Trío de 5 · Ahora mismo serías la peor tirada');
    expect(jugada).toHaveClass('jugada-actual--peligro');
});

test('quien abre la ronda no tiene tirada a superar y no se compara', () => {
    const jugada = jugadaActual([5, 5, 3, 5, 1], null);
    expect(jugada).toHaveTextContent(/^Llevas: Póker de 5$/);
    expect(jugada).not.toHaveClass('jugada-actual--peligro');
    expect(jugada).not.toHaveClass('jugada-actual--a-salvo');
});

test('antes de tirar no enseña nada', () => {
    const { container } = render(<JugadaActual jugada={null} peorTirada={peorDeJ4} />);
    expect(container).toBeEmptyDOMElement();
});
