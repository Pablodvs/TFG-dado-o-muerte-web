-- Actualiza una base de datos de la versión 1 al esquema actual. Ejecútalo UNA sola vez
-- sobre la base de datos existente (con phpMyAdmin, o con "npm run db:init -- db/migracion-v1.sql").
-- Las partidas y jugadores existentes se conservan.

ALTER TABLE partida
  ADD COLUMN tirada_max TINYINT NULL,
  ADD COLUMN ronda INT NOT NULL DEFAULT 1,
  ADD COLUMN finalizada TINYINT(1) NOT NULL DEFAULT 0;

-- La versión 1 marcaba "sin puntuación" con 0 en vez de NULL (0 no es una puntuación posible)
UPDATE jugadores SET puntuacion = NULL WHERE puntuacion = 0;

-- Las partidas en las que alguien se quedó sin vidas ya habían terminado
UPDATE partida p SET finalizada = 1
 WHERE EXISTS (SELECT 1 FROM jugadores j WHERE j.partida_id = p.id AND j.vidas <= 0);
