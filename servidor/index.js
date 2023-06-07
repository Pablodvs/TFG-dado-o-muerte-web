const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')
const cors = require('cors')

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dado-o-muerte'
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())


app.get("/api/get", (req, res) => {
    let sqlSelect = "SELECT * FROM jugadores"
    db.query(sqlSelect, (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send(result)
        }
    })
})

app.post("/api/anadir-jugadores", (req, res) => {
    const players = req.body.players; // Suponiendo que los jugadores se envían en el cuerpo de la solicitud con la clave "players"

    const selectedPlayerIndex = Math.floor(Math.random() * players.length); // Seleccionar un índice de jugador aleatorio

    const updatedPlayers = players
        .slice(selectedPlayerIndex)
        .concat(players.slice(0, selectedPlayerIndex))
        .slice(1); // Modificar el orden de los jugadores según la lógica específica y eliminar el primer jugador seleccionado

    const values = updatedPlayers.map((player, index) => [player, 3, index + 1]); // Asignar el orden a los jugadores modificados

    const selectedPlayer = players[selectedPlayerIndex];
    values.unshift([selectedPlayer, 3, updatedPlayers.length + 1]); // Agregar el jugador seleccionado al principio de la lista con el orden correspondiente

    let sqlInsertPartida = "INSERT INTO partida (create_at, turno) VALUES (CURRENT_TIMESTAMP, 0)";

    db.query(sqlInsertPartida, (err, result) => {
        if (err) {
            res.status(500).json({ error: "Error al crear la partida" });
        } else {
            const partidaId = result.insertId;
            const valuesWithPartidaId = values.map((value) => [...value, partidaId]);

            const sqlInsertJugadores = "INSERT INTO jugadores (nombre, vidas, orden, partida_id) VALUES ?";
            db.query(sqlInsertJugadores, [valuesWithPartidaId], (err, result) => {
                if (err) {
                    res.status(500).json({ error: "Error al agregar los jugadores" });
                } else {
                    res.status(200).json({ partida_id: partidaId, message: "Jugadores agregados exitosamente" });
                }
            });
        }
    });
})

app.post('/api/datos-partida', (req, res) => {
    console.log('req:', req.body)
    let partida_id = req.body.partida_id
    let sqlSelect = "SELECT * FROM jugadores WHERE partida_id = " + partida_id + " ORDER BY orden;"
    db.query(sqlSelect, partida_id, (err, result) => {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    })
})

app.post("/api/insert", (req, res) => {
    let sqlInsert = "INSERT INTO jugadores (nombre, vidas) VALUES ('pablo', 3);"
    db.query(sqlInsert, (err, result) => {
        if (err) {
            console.log(err)
        } else {
            console.log(result)
        }
    })
})

app.post('/api/set-puntuacion', (req, res) => {
    const data = req.body;
    const values = data[0];
    const playerId = data[1];

    let score = 0;
    if (escalera(values)) {
        score = 60;
    } else {
        score = setPuntuacion(values);
    }

    const sqlUpdate = `UPDATE jugadores SET puntuacion = ${score} WHERE id = ${playerId};`;

    db.query(sqlUpdate, (err, result) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            // Ejecutar la segunda consulta solo si la primera fue exitosa
            let sqlUpdateDados = `UPDATE jugadores SET dados_guardados = ? WHERE id = ?`;
            db.query(sqlUpdateDados, [values.join(','), playerId], (err, result) => {
                if (err) {
                    res.status(500).json({ error: err });
                } else {
                    res.status(200).json(result);
                }
            });
        }
    });
});

app.post('/api/fin-ronda', (req, res) => {
    const partida_id = req.body.partida_id;

    const sqlSelectLowestScore = `SELECT id, puntuacion FROM jugadores WHERE partida_id = ${partida_id} ORDER BY puntuacion ASC, orden DESC LIMIT 1`;
    db.query(sqlSelectLowestScore, (err, result) => {
        if (err) {
            res.status(500).json({ error: "Error al obtener la puntuación más baja" });
        } else {
            const playerId = result[0].id;
            const sqlUpdateVidas = "UPDATE jugadores SET vidas = vidas - 1 WHERE id = ?";
            db.query(sqlUpdateVidas, playerId, (err, result) => {
                if (err) {
                    res.status(500).json({ error: "Error al actualizar las vidas" });
                } else {
                    const sqlSelectAllPlayers = `SELECT id, orden FROM jugadores WHERE partida_id = ${partida_id} ORDER BY orden ASC`;
                    db.query(sqlSelectAllPlayers, (err, result) => {
                        if (err) {
                            res.status(500).json({ error: "Error al obtener los jugadores" });
                        } else {
                            const players = result;
                            const perdedorIndex = players.findIndex(player => player.id === playerId);
                            const nuevosPlayers = [
                                players[perdedorIndex],
                                ...players.slice(perdedorIndex + 1),
                                ...players.slice(0, perdedorIndex)
                            ];
                            const sqlUpdateOrden = `UPDATE jugadores SET orden = CASE id ${nuevosPlayers.map((player, index) => `WHEN '${player.id}' THEN ${index + 1}`).join(' ')} END WHERE id IN (${nuevosPlayers.map(player => `'${player.id}'`).join(', ')})`;
                            db.query(sqlUpdateOrden, (err, result) => {
                                if (err) {
                                    res.status(500).json({ error: "Error al reordenar los jugadores" });
                                } else {
                                    res.status(200).json({ message: "Vidas actualizadas y jugadores reordenados correctamente", perdedor: playerId });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

app.post('/api/reiniciar-puntuaciones', (req, res) => {
    const partida_id = req.body.partida_id; // Partida ID para la cual se reiniciará la puntuación

    const sqlResetPuntuacion = `UPDATE jugadores SET puntuacion = 0, dados_guardados = null WHERE partida_id = ${partida_id}`;
    db.query(sqlResetPuntuacion, (err, result) => {
        if (err) {
            res.status(500).json({ error: "Error al reiniciar la puntuación" });
        } else {
            res.status(200).json({ message: "Puntuación reiniciada correctamente" });
        }
    });
})

app.get('/api/fin-partida/:id', (req, res) => {
    const partidaId = req.params.id;

    const sql = `SELECT COUNT(*) AS count FROM jugadores WHERE partida_id = ${partidaId} AND vidas = 0`;

    db.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al verificar la partida' });
        } else {
            const count = result[0].count;
            const isFinPartida = count > 0;
            res.json(isFinPartida);
        }
    });
});

app.post('/api/siguiente-turno', (req, res) => {
    let sqlUpdate = ''
    if (req.body.length > 1) {
        let partida_id = req.body[0].partida_id
        sqlUpdate = `UPDATE partida SET turno = 0 WHERE id = ${partida_id} `
    } else {
        let partida_id = req.body.partida_id
        sqlUpdate = `UPDATE partida SET turno = turno + 1 WHERE id = ${partida_id} `
    }
    db.query(sqlUpdate, (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send(result)
        }
    })

    // let sqlUpdate = `UPDATE partida SET turno = turno + 1 WHERE id = ${partida_id} `
    // db.query(sqlUpdate, (err, result) => {
    //     if (err) {
    //         res.send(err)
    //     } else {
    //         res.send(result)
    //     }
    // })
})

app.get('/api/turno/:id', (req, res) => {
    // let partida_id = req.body.partida_id
    let partida_id = req.params.id
    let sqlSelect = `SELECT turno FROM partida WHERE id = ${partida_id}`
    db.query(sqlSelect, (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send(result)
        }
    })
})

app.post('/api/peor-tirada', (req, res) => {
    let partida_id = req.body.partida_id;
    sqlSelect = `SELECT nombre, dados_guardados, puntuacion as peor_puntuacion FROM jugadores WHERE partida_id = ${partida_id} AND puntuacion > 0 ORDER BY puntuacion ASC, orden DESC LIMIT 1`;
    db.query(sqlSelect, (err, result) => {
        if (err) {
            res.send(err);
        } else {
            // Convertir la cadena de dados_guardados en un array
            const dadosGuardadosArray = result[0].dados_guardados.split(',');

            // Asignar el array convertido a la propiedad dados_guardados del resultado
            result[0].dados_guardados = dadosGuardadosArray;

            res.json(result);
        }
    });
});

app.get('/api/perdedor-partida/:id', (req, res) => {
    let partida_id = req.params.id
    let sqlSelect = `SELECT nombre FROM jugadores WHERE partida_id = ${partida_id} AND vidas = 0`
    db.query(sqlSelect, (err, result) => {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    })
})

app.post('/api/get-vidas', (req, res) => {
    let partida_id = req.body.partida_id
    let sqlSelect = `SELECT nombre, vidas FROM jugadores WHERE partida_id = ${partida_id}`
    db.query(sqlSelect, (err, result) => {
        if (err) {
            res.status(500).json({ error: "Error al agregar los jugadores" });
        } else {
            res.send(result)
        }
    })
})




app.listen(3001, () => {
    console.log('running on port 3001');
})



function escalera(arr) {
    const numerosPresentes = new Array(7).fill(false);

    for (let i = 0; i < arr.length; i++) {
        const numero = arr[i];
        if (numero >= 2 && numero <= 6) {
            numerosPresentes[numero] = true;
        }
    }

    for (let j = 2; j <= 6; j++) {
        if (!numerosPresentes[j]) {
            return false;
        }
    }

    return true;
}

function setPuntuacion(values) {

    let valor = 1;

    for (const v of values) {
        if (v !== 1) {
            valor = v;
            break;
        }
    }
    for (let i = 0; i < values.length; i++) {
        if (values[i] === 1) {
            values[i] = valor;
        }
    }

    let count = new Array(7).fill(0);
    let val = 0;

    values.forEach(i => {
        count[i]++;
        val = i;
    });

    const score = (count[val] * 10) + val;

    return score
}