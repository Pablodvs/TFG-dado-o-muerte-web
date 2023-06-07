import { useState } from "react";
import axios from 'axios'
import { useDispatch } from "react-redux";
import { setId } from "../slices/PartidaSlice";
import { useNavigate } from "react-router-dom";
export default function PantallaEleccion() {
    const server = 'http://localhost:3001'
    const [players, setPlayers] = useState([]);
    const [newPlayer, setNewPlayer] = useState('');

    const navigate = useNavigate()

    const dispatch = useDispatch()

    const handleInputChange = (event) => {
        setNewPlayer(event.target.value);
    };

    const handleAñadirJugador = (event) => {
        event.preventDefault();
        if (newPlayer.trim() !== '') {
            setPlayers([...players, newPlayer]);
            setNewPlayer('');
        }
    };

    const handleBorrarJugador = (player) => {
        setPlayers(players.filter((p) => p !== player));
    };

    const handleEmpezar = async () => {
        let response = await axios.post(server + '/api/anadir-jugadores', { players })
        let id = response.data.partida_id
        localStorage.setItem('partidaId', id);
        dispatch(setId(id))
        navigate('/partida')
    }

    return (
        <div className="container">
            <h2 className="text-center">Jugadores</h2>
            <form onSubmit={handleAñadirJugador}>
                <div className="input-group mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Nombre del jugador"
                        value={newPlayer}
                        onChange={handleInputChange}
                    />
                    <button type="submit" className="btn btn-primary">Añadir</button>
                </div>
            </form>
            <ul className="list-group">
                {players.map((player) => (
                    <li className="list-group-item d-flex justify-content-between" key={player}>
                        {player}
                        <button className="btn btn-danger" onClick={() => handleBorrarJugador(player)}>Eliminar</button>
                    </li>
                ))}
            </ul>
            {players.length > 1 ?
                <div className="text-center">
                    <button onClick={() => handleEmpezar()} className="btn btn-primary">Empezar partida</button>
                </div>
                : ''
            }
        </div>
    );
}