import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import Cargando from '../componentes/Cargando';
import ErrorConexion from '../componentes/ErrorConexion';
import Marcador from '../componentes/Marcador';
import PasarMovil from '../componentes/PasarMovil';
import PeorTirada from '../componentes/PeorTirada';
import ReglasJuego from '../componentes/ReglasJuego';
import ResumenRonda from '../componentes/ResumenRonda';
import Turno from '../componentes/Turno';
import usePartidaGuardada from '../hooks/usePartidaGuardada';
import { textoError } from '../api';
import clases from '../lib/clases';
import {
    cerrarResumenRonda,
    claveTurnoDe,
    jugadorActualDe,
    plantarse,
    selectPartida,
    tiradaMaxDe,
} from '../slices/partida';

export default function PantallaPartida() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { partidaId, estado, error, reintentar } = usePartidaGuardada();
    const { enviando, errorJugada, rondaTerminada } = useSelector(selectPartida);
    // Clave del turno que ya se ha "recogido" en la pantalla de pasar el móvil.
    // No se persiste: tras recargar se vuelve a preguntar quién tiene el móvil.
    const [turnoEmpezado, setTurnoEmpezado] = useState(null);

    if (partidaId === null) return <Navigate to="/" replace />;

    if (!estado) {
        return (
            <main className="partida partida--cargando">
                {error
                    ? <ErrorConexion mensaje={textoError(t, error)} onReintentar={reintentar} />
                    : <Cargando texto={t('partida.cargando')} />}
            </main>
        );
    }

    if (estado.finalizada && !rondaTerminada) return <Navigate to="/fin" replace />;

    const jugador = jugadorActualDe(estado);
    const clave = claveTurnoDe(estado);
    const tiradaMax = tiradaMaxDe(estado);

    if (!jugador && !rondaTerminada) {
        return (
            <main className="partida partida--cargando">
                <ErrorConexion
                    titulo={t('partida.estadoInesperado')}
                    mensaje={t('partida.pruebaDeNuevo')}
                    onReintentar={reintentar}
                />
            </main>
        );
    }

    let zona;
    let fase;
    if (rondaTerminada) {
        fase = 'resumen';
        // Si la partida ha acabado, el resumen se conserva: la pantalla final enseña la última jugada
        const continuar = rondaTerminada.finPartida
            ? () => navigate('/fin')
            : () => dispatch(cerrarResumenRonda());
        zona = <ResumenRonda resumen={rondaTerminada} onContinuar={continuar} />;
    } else if (turnoEmpezado !== clave) {
        fase = 'pasar';
        zona = (
            <PasarMovil
                jugador={jugador}
                abreRonda={estado.turno === 0}
                tiradaMax={tiradaMax}
                ronda={estado.ronda}
                peorTirada={estado.peorTirada}
                onEmpezar={() => setTurnoEmpezado(clave)}
            />
        );
    } else {
        fase = 'turno';
        zona = (
            <Turno
                key={clave}
                clave={clave}
                jugador={jugador}
                tiradaMax={tiradaMax}
                peorTirada={estado.peorTirada}
                enviando={enviando}
                error={errorJugada}
                onPlantarse={({ dados, tiradas }) => dispatch(plantarse({ jugadorId: jugador.id, dados, tiradas }))}
            />
        );
    }

    return (
        <main className={clases('partida', `partida--${fase}`)}>
            <header className="partida__cabecera">
                <h1 className="partida__ronda">{t('comun.ronda', { ronda: rondaTerminada?.ronda ?? estado.ronda })}</h1>
                <p className="partida__detalle">
                    {rondaTerminada
                        ? t('partida.rondaTerminada')
                        : t('partida.turnoDeTotal', { turno: estado.turno + 1, total: estado.jugadores.length })}
                </p>
            </header>

            {!rondaTerminada && (
                <div className="partida__objetivo">
                    <PeorTirada peorTirada={estado.peorTirada} />
                </div>
            )}

            <div className="partida__zona">{zona}</div>

            <div className="partida__info">
                <Marcador
                    jugadores={estado.jugadores}
                    jugadorActualId={rondaTerminada ? null : jugador?.id}
                    peorJugadorId={estado.peorTirada?.jugadorId}
                />
                <ReglasJuego />
            </div>
        </main>
    );
}
