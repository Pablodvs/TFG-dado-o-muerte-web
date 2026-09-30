-- Esquema de Dice or Die (MySQL 8 / MariaDB). Se puede ejecutar varias veces.
-- Con "npm run db:init" el nombre de la base de datos se toma de DB_NAME.
-- Si ya tienes la base de datos de la versión 1, aplica también migracion-v1.sql.
-- Las bases de datos sin la columna id_publico la reciben al ejecutar "npm run db:init".

CREATE DATABASE IF NOT EXISTS `dado-o-muerte`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `dado-o-muerte`;

CREATE TABLE IF NOT EXISTS partida (
  id          INT         NOT NULL AUTO_INCREMENT,
  -- el id que usa la API: 16 bytes aleatorios en base64url; distingue mayúsculas
  id_publico  CHAR(22)    CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  create_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  turno       INT         NOT NULL DEFAULT 0,     -- índice (desde 0) del jugador al que le toca
  tirada_max  TINYINT     NULL,                   -- tiradas que usó el primer jugador de la ronda
  ronda       INT         NOT NULL DEFAULT 1,
  finalizada  TINYINT(1)  NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_partida_id_publico (id_publico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jugadores (
  id               INT          NOT NULL AUTO_INCREMENT,
  nombre           VARCHAR(20)  NOT NULL,
  vidas            TINYINT      NOT NULL DEFAULT 3,
  orden            INT          NOT NULL,         -- posición en la ronda actual (1 = empieza)
  partida_id       INT          NOT NULL,
  puntuacion       INT          NULL,             -- NULL si aún no ha jugado esta ronda
  dados_guardados  VARCHAR(20)  NULL,             -- los 5 dados, p. ej. "1,2,2,5,6"
  PRIMARY KEY (id),
  KEY idx_jugadores_partida (partida_id, orden),
  CONSTRAINT fk_jugadores_partida FOREIGN KEY (partida_id)
    REFERENCES partida (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
