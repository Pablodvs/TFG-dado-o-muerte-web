import { fireEvent, screen, waitFor } from '@testing-library/react';
import * as api from '../api';
import { leerPartidaId } from '../lib/almacen';
import { errorHttp, estadoPartida, nombresDe, renderApp } from '../test-utils';

vi.mock('../api', async (importOriginal) => ({
    ...(await importOriginal()),
    crearPartida: vi.fn(),
    obtenerPartida: vi.fn(),
    plantarse: vi.fn(),
}));

beforeEach(() => localStorage.clear());

// Escribe el nombre y pulsa Enter (envía el formulario)
function anadir(nombre) {
    const entrada = screen.getByLabelText('Nombre del jugador');
    fireEvent.change(entrada, { target: { value: nombre } });
    fireEvent.submit(entrada.form);
}

function apuntados() {
    const lista = screen.queryByRole('list', { name: 'Jugadores apuntados' });
    return lista ? nombresDe(lista) : [];
}

test('añade jugadores con Enter y solo deja empezar con 2 o más', () => {
    renderApp('/');
    const empezar = screen.getByRole('button', { name: 'Empezar partida' });
    expect(empezar).toBeDisabled();

    anadir('  Ana  ');
    expect(empezar).toBeDisabled();
    anadir('Luis');
    expect(empezar).toBeEnabled();

    expect(apuntados()).toEqual(['Ana', 'Luis']);
    expect(screen.getByLabelText('Nombre del jugador')).toHaveValue('');
});

test('avisa de nombres repetidos sin distinguir mayúsculas', () => {
    renderApp('/');
    anadir('Ana');
    anadir('ANA');

    expect(screen.getByRole('alert')).toHaveTextContent('Ya hay alguien que se llama ANA');
    expect(apuntados()).toEqual(['Ana']);

    // Al corregir el nombre desaparece el aviso
    fireEvent.change(screen.getByLabelText('Nombre del jugador'), { target: { value: 'ANAS' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('no añade nombres vacíos', () => {
    renderApp('/');
    anadir('   ');
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe un nombre');
    expect(apuntados()).toEqual([]);
});

test('quitar un jugador solo quita ese', () => {
    renderApp('/');
    anadir('Ana');
    anadir('Luis');
    anadir('Eva');

    fireEvent.click(screen.getByRole('button', { name: 'Quitar a Luis' }));

    expect(apuntados()).toEqual(['Ana', 'Eva']);
});

test('con 8 jugadores no deja añadir más', () => {
    renderApp('/');
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(anadir);
    expect(screen.getByLabelText('Nombre del jugador')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Añadir' })).toBeDisabled();
});

test('empezar crea la partida y va a la pantalla de juego', async () => {
    api.crearPartida.mockResolvedValue(estadoPartida());
    renderApp('/');
    anadir('Ana');
    anadir('Luis');

    fireEvent.click(screen.getByRole('button', { name: 'Empezar partida' }));

    expect(await screen.findByText('Toca para empezar')).toBeInTheDocument();
    expect(api.crearPartida).toHaveBeenCalledWith(['Ana', 'Luis']);
    expect(leerPartidaId()).toBe(12);
});

test('muestra el error si no se puede crear la partida', async () => {
    api.crearPartida.mockRejectedValue(errorHttp(400, 'Nombres no válidos'));
    renderApp('/');
    anadir('Ana');
    anadir('Luis');

    fireEvent.click(screen.getByRole('button', { name: 'Empezar partida' }));

    expect(await screen.findByText('Nombres no válidos')).toBeInTheDocument();
});

test('ofrece continuar la partida guardada', async () => {
    localStorage.setItem('dadoOMuerte:partidaId', '12');
    api.obtenerPartida.mockResolvedValue(estadoPartida({ ronda: 3 }));
    renderApp('/');

    expect(await screen.findByRole('link', { name: 'Continuar partida' })).toHaveAttribute('href', '/partida');
    expect(screen.getByText('Ronda 3 · Ana, Luis')).toBeInTheDocument();
});

test('no ofrece continuar una partida terminada, ni mientras se carga', async () => {
    localStorage.setItem('dadoOMuerte:partidaId', '12');
    api.obtenerPartida.mockResolvedValue(estadoPartida({ finalizada: true, perdedor: { id: 6, nombre: 'Luis' } }));
    const { store } = renderApp('/');

    // Aún no se sabe si está terminada: no se enseña (antes parpadeaba)
    expect(store.getState().partida.cargando).toBe(true);
    expect(screen.queryByText('Hay una partida a medias')).not.toBeInTheDocument();
    await waitFor(() => expect(store.getState().partida.estado?.finalizada).toBe(true));
    expect(screen.queryByRole('link', { name: 'Continuar partida' })).not.toBeInTheDocument();
});

test('antes de sustituir una partida guardada pide confirmación', async () => {
    localStorage.setItem('dadoOMuerte:partidaId', '12');
    api.obtenerPartida.mockResolvedValue(estadoPartida({ ronda: 3 }));
    api.crearPartida.mockResolvedValue(estadoPartida({ id: 13 }));
    renderApp('/');
    await screen.findByText('Ronda 3 · Ana, Luis');
    anadir('Eva');
    anadir('Pablo');

    fireEvent.click(screen.getByRole('button', { name: 'Empezar partida' }));
    const pregunta = screen.getByRole('group', { name: '¿Empezar una partida nueva?' });
    expect(pregunta).toHaveTextContent('La partida a medias (ronda 3) se abandonará');
    expect(api.crearPartida).not.toHaveBeenCalled();

    // Cancelar deja todo como estaba
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Empezar partida' })).toHaveFocus();
    expect(leerPartidaId()).toBe(12);

    fireEvent.click(screen.getByRole('button', { name: 'Empezar partida' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, empezar otra' }));

    expect(await screen.findByText('Toca para empezar')).toBeInTheDocument();
    expect(api.crearPartida).toHaveBeenCalledWith(['Eva', 'Pablo']);
    expect(leerPartidaId()).toBe(13);
});
