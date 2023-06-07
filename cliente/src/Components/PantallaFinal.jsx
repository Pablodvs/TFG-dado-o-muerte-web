import axios from "axios";
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom";
import { setId } from "../slices/PartidaSlice";

export default function PantallaFinal() {
    const server = 'http://localhost:3001';
    const partida_id = localStorage.getItem('partidaId');
    const [perdedor, setPerdedor] = useState('')
    const jugadores = useSelector(state => state.partida?.jugadores || [])
    const dispatch = useDispatch()
    const navigate = useNavigate()

    useEffect(() => {
        getPerdedor()
    })

    const getPerdedor = async () => {
        let response = await axios.get(server + `/api/perdedor-partida/${partida_id}`);
        if (response.data && response.data.length > 0) {
            setPerdedor(response.data[0].nombre);
            localStorage.clear();
        }
    };


    const nuevaPartida = async () => {
        let players = []
        jugadores.map(jugador => {
            players.push(jugador.nombre)
        })
        let response = await axios.post(server + '/api/anadir-jugadores', { players })
        let id = response.data.partida_id
        localStorage.setItem('partidaId', id);
        dispatch(setId(id))
        navigate('/partida')
    }

    return (
        <>
            <h1 className="text-center">El perdedor de la partida es Pablo</h1>
            <div className="text-center">
                <button className="btn btn-primary mt-5" onClick={() => nuevaPartida()}>Volver a jugar</button>
            </div>
            <div className="text-center">
                <button className="btn btn-primary mt-4" onClick={() => navigate('/')} >Volver al menú principal</button>
            </div>
        </>
    )
}