const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
module.exports = app;
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializerDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializerDBServer();

const convertDbObjectIntoResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};
//Returns a list of all the players in the player table

app.get("/players/", async (require, response) => {
  const getPlayerDetailQuery = `
    select * from player_details;`;
  const dbResponse = await db.all(getPlayerDetailQuery);
  response.send(
    dbResponse.map((eachArray) => convertDbObjectIntoResponseObject(eachArray))
  );
});

//Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerParticularDetailQuery = `select * from 
    player_details where player_id = ${playerId};`;
  const dbResponse = await db.get(playerParticularDetailQuery);
  response.send(convertDbObjectIntoResponseObject(dbResponse));
});

//Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetail = request.body;
  const { playerName } = playerDetail;
  const updatePlayerDetailQuery = `update player_details set 
    player_name = '${playerName}' where player_id = ${playerId};`;
  dbResponse = await db.run(updatePlayerDetailQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchParticularDetailQuery = `select * from 
    match_details where match_id = ${matchId};`;
  const dbResponse = await db.get(matchParticularDetailQuery);
  response.send(convertDbObjectIntoResponseObject(dbResponse));
});

//Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchesQuery = `
    select match_id, match, year from player_match_score natural join match_details 
    where player_id = ${playerId};`;
  const dbResponse = await db.all(playerMatchesQuery);
  response.send(
    dbResponse.map((eachArray) => convertDbObjectIntoResponseObject(eachArray))
  );
});

//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerListQuery = `SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const dbResponse = await db.all(playerListQuery);
  response.send(dbResponse);
});

/* Returns the statistics of the total score, fours, sixes of a 
specific player based on the player ID */

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScore = `select player_details.player_id as playerId, 
    player_details.player_name as playerName, 
    sum(player_match_score.score) as totalScore, 
    sum(fours) as totalFours, 
    sum(sixes) as totalSixes from player_details inner join 
    player_match_score on player_details.player_id = 
    player_match_score.player_id where 
    player_details.player_id = ${playerId};`;
  const playerScores = await db.get(getPlayerScore);

  response.send(playerScores);
});
