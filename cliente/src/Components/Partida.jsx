import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import dado1 from '../images/dado1.png';
import dado2 from '../images/dado2.png';
import dado3 from '../images/dado3.png';
import dado4 from '../images/dado4.png';
import dado5 from '../images/dado5.png';
import dado6 from '../images/dado6.png';
import vidaIcono from '../images/vidas.png'
import { setId, setJugadores, setPerdedor, setVidas, setTurno } from '../slices/PartidaSlice';
import { setJugador } from '../slices/JugadorSlice';
import { useNavigate } from 'react-router-dom';

export default function Partida() {
    //states
    const turno = useSelector(state => state.partida?.turno);
    const [dadosGuardados, setDadosGuardados] = useState([]);
    const [dados, setDados] = useState(Array(5 - dadosGuardados.length).fill(1));
    const [tirada, setTirada] = useState(0);
    const [tiradaMax, setTiradaMax] = useState(3);

    //redux
    const jugadores = useSelector(state => state.partida.jugadores);
    const nombre = useSelector(state => state.jugador?.nombre || '');
    const vidasJugador = useSelector(state => state.jugador?.vidas || '');
    const jugador_id = useSelector(state => state.jugador?.id || '');
    const perdedor = useSelector(state => state.partida?.perdedor || [])
    const ronda = useSelector(state => state.partida?.ronda)
    const vidas = useSelector(state => state.partida?.vidas)
    const mostrarVidas = useSelector(state => state.partida?.mostrarVidas)

    const partida_id = localStorage.getItem('partidaId');
    const perdedor_dados = perdedor[0]?.dados_guardados || []

    const flecha = '->'

    const server = 'http://localhost:3001';


    const [isRolling, setIsRolling] = useState(false);

    const navigate = useNavigate()
    const dispatch = useDispatch();

    const cargarDatosPartida = async () => {
        dispatch(setId(partida_id))
        let response = await axios.post(server + '/api/datos-partida', { partida_id });
        dispatch(setJugadores(response.data));
        dispatch(setJugador(response.data[turno]));
        turnoInicio()

    };

    useEffect(() => {
        cargarDatosPartida();
        dispatch(setJugador(jugadores[turno]))
        peorTirada()
    }, [turno])

    const turnoInicio = async () => {
        await axios.get(server + `/api/turno/${partida_id}`)
        //setTurno(response.turno)
    }

    const lanzarDados = () => {
        if (tirada < tiradaMax) {
            setTirada(tirada + 1);
            setIsRolling(true);

            const nuevosDados = dados.map(() => Math.floor(Math.random() * 6) + 1);
            setDados(nuevosDados);

            setTimeout(() => {
                setIsRolling(false);
            }, 300 * dados.length);
        }
    };

    const guardarDado = (valor, index) => {
        if (tirada !== 0) {
            setDadosGuardados([...dadosGuardados, valor]);
            const nuevosDados = [...dados];
            nuevosDados.splice(index, 1);
            setDados(nuevosDados);
        }
    };

    const borrarDado = (valor, index) => {
        const nuevosDadosGuardados = [...dadosGuardados];
        nuevosDadosGuardados.splice(index, 1);
        setDadosGuardados(nuevosDadosGuardados);
        const nuevosDados = [...dados, valor];
        setDados(nuevosDados);
    };

    const dadosC = dados.map((dado, index) => (
        <img
            key={index}
            src={
                dado === 1
                    ? dado1
                    : dado === 2
                        ? dado2
                        : dado === 3
                            ? dado3
                            : dado === 4
                                ? dado4
                                : dado === 5
                                    ? dado5
                                    : dado6
            }
            alt={`Dado ${index}`}
            className={`dado ${isRolling ? "rolling" : ""}`}
            onClick={() => guardarDado(dado, index)}
        />
    ));

    const dadosG = dadosGuardados.map((dado, index) => (
        <div key={index}>
            <img
                src={
                    dado === 1
                        ? dado1
                        : dado === 2
                            ? dado2
                            : dado === 3
                                ? dado3
                                : dado === 4
                                    ? dado4
                                    : dado === 5
                                        ? dado5
                                        : dado6
                }
                alt={`Dado ${index + 1}`}
                className="dado-guardado"
            />
            <button className='btn btn-danger' onClick={() => borrarDado(dado, index)}>Eliminar</button>
        </div>
    ));

    const finRonda = async () => {
        await axios.post(server + '/api/fin-ronda', { partida_id })
        await axios.post(server + '/api/reiniciar-puntuaciones', { partida_id })
        let response = await axios.get(server + `/api/fin-partida/${partida_id}`)
        if (response.data) {
            navigate('/pantalla-final')
        }
        dispatch(setPerdedor(null))
        dispatch(setVidas(ronda + 1))
    }

    const plantarse = async () => {
        await axios.post(server + '/api/set-puntuacion', [dadosGuardados, jugador_id]);
        if (turno === 0) {
            setTiradaMax(tirada)
        }

        if (turno < jugadores.length - 1) {
            dispatch(setTurno(turno + 1));
            await axios.post(server + '/api/siguiente-turno', { partida_id })
        } else {
            finRonda()
            await axios.post(server + '/api/siguiente-turno', ([{ partida_id }, 0]))
            dispatch(setTurno(0));
            setTiradaMax(3)
        }
        resetDados()
        setTirada(0)
    };

    const resetDados = () => {
        setDadosGuardados([])
        setDados(Array(5).fill(1))
    }

    const peorTirada = async () => {
        if (turno !== 0) {
            let response = await axios.post(server + '/api/peor-tirada', { partida_id })
            dispatch(setPerdedor(response.data))
        }
    }

    const vidasMostrar = Array.isArray(vidas) ? vidas.map((jugador, index) => (
        <div key={index} className="d-flex pe-10">
            <h3 className="pe-2">{jugador.nombre} {flecha} {jugador.vidas}</h3>
            <img src={vidaIcono} alt="vida" style={{ width: '20px', height: '20px', marginRight: '3px', marginTop: '7px' }} />
        </div>
    )) : null;

    return (
        <div className="container">
            <div className="row">
                <div className="col">
                    <h3 id="nombre">{nombre}</h3>
                </div>
                <div className="col">
                    <h3>Vidas: {vidasJugador}</h3>
                </div>
                <div className="col">
                    <h3>Tirada: {tirada}/{tiradaMax}</h3>
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <div className="d-flex flex-wrap justify-content-center">{dadosC}</div>
                </div>
            </div>
            <div className="row mt-3">
                <div className="col text-center">
                    <button className="btn btn-primary me-2" onClick={lanzarDados}>
                        Lanzar los dados
                    </button>
                    <button className="btn btn-secondary" onClick={plantarse}>
                        Plantarse
                    </button>
                </div>
            </div>

            <div className='d-flex flex-wrap pt-3'>{dadosG}</div>

            {mostrarVidas && <div className='m-5 '>{vidasMostrar}</div>}

        </div>


    );
}
