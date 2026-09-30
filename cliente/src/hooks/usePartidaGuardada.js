import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { leerPartidaId } from '../lib/almacen';
import { cargarPartida, selectPartida } from '../slices/partida';

// La partida cuyo id está en localStorage. Si Redux aún no la tiene (p. ej.
// tras recargar la página) la pide al servidor.
// estado es null hasta que la partida guardada está cargada.
export default function usePartidaGuardada() {
    const dispatch = useDispatch();
    const { estado, cargando, errorCarga } = useSelector(selectPartida);
    const partidaId = leerPartidaId();
    const cargada = partidaId !== null && estado?.id === partidaId;

    useEffect(() => {
        if (partidaId !== null && !cargada) dispatch(cargarPartida(partidaId));
    }, [dispatch, partidaId, cargada]);

    const reintentar = useCallback(() => {
        if (partidaId !== null) dispatch(cargarPartida(partidaId));
    }, [dispatch, partidaId]);

    return {
        partidaId,
        estado: cargada ? estado : null,
        cargando,
        error: cargada ? null : errorCarga,
        reintentar,
    };
}
