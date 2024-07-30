import { CaballosState } from "../types/CaballosState";
import { User } from "../types/User";
import { Rooms } from "../types/Rooms";
import { EASTER_EGG, NICKNAMES } from "./usernames";
import { CONFIG } from '../global';

const rooms: Rooms = {};
let tappingFactor!: number

const initTappingFactor = (room: string) => {
  try {
    //Se restan 2 por el admin y el viewer, el 5 representa la cantidad de equipos (caballos)
    const teamSize = rooms[room].users.length > 5 ? (rooms[room].users.length - 2) / (rooms[room].caballosCount ?? 5) : 1

    //Distancia en X que debe recorrer un caballo para ganar
    const totalDistance = CONFIG.x - (2 * CONFIG.HorsesInitialX)

    //Tiempo en SEGUNDOS que queremos que el juego dure
    const time = CONFIG.timer - 10

    //Cuantos taps por segundo dan nuestros usuarios (suponiendo que dan 9)
    const tps = 9

    tappingFactor = totalDistance / (time * tps * teamSize)

  } catch (error) {
    tappingFactor = 1
  }
}

const getViewer = (room_id: string): User | void => {
  try {
    return rooms[room_id].users.find((user) => user.username === 'viewer');
  } catch (error) { }
}

const getIDTeamLessPlayers = (teamsPlayerCount: Array<number>): number => {
  let playerCount = teamsPlayerCount[0]
  let id = 0

  for (let i = 1; i < teamsPlayerCount.length; i++) {
    if (teamsPlayerCount[i] <= playerCount) {
      playerCount = teamsPlayerCount[i]
      id = i
    }
  }

  return id
}

const setWinnerInState = (winner_team: string, room_id: string) => {
  try {
    if (rooms[room_id].state.winner === undefined || rooms[room_id].state.winner === null) {
      rooms[room_id].state.winner = winner_team
    } else {
      if (rooms[room_id].state.winner!.length === 0) {
        rooms[room_id].state.winner = winner_team
      }
    }
  } catch (error) {

  }
}

const isEveryoneFinished = (state: CaballosState, room_id: string): boolean => {
  try {
    let howMany = 0
    state.blue >= CONFIG.x - (2 * CONFIG.HorsesInitialX) ? howMany++ : null
    state.gray >= CONFIG.x - (2 * CONFIG.HorsesInitialX) ? howMany++ : null
    state.green >= CONFIG.x - (2 * CONFIG.HorsesInitialX) ? howMany++ : null
    state.red >= CONFIG.x - (2 * CONFIG.HorsesInitialX) ? howMany++ : null
    state.yellow >= CONFIG.x - (2 * CONFIG.HorsesInitialX) ? howMany++ : null
    
    return howMany >= getCaballosCount(room_id)
  } catch (error) {
    return true
  }
}

const addRoom = (room: string, state: CaballosState) => {
  try {
    rooms[room] = {
      users: [],
      state: state,
      tapsTimes: {}
    }
  } catch (error) { }
}

const getRoom = (id: string) => {
  try {
    return rooms[id]
  } catch (error) {
    return null
  }
}

const addUser = (userInfo: User): boolean => {
  try {
    const user = userInfo;
    rooms[userInfo.room].users.push(user);
    return true
  } catch (error) {
    return false
  }
}

const removeUser = (id: string, room: string): User | void => {
  try {
    const index = rooms[room].users.findIndex((user) => user.id === id);

    if (index !== -1) {
      return rooms[room].users.splice(index, 1)[0];
    }
  } catch (error) { }
}

const getUser = (id: string, room: string) => {
  try {
    return rooms[room].users.find((user) => user.id === id);

  } catch (error) { }
}

const getUsersInRoom = (room: string) => {
  try {
    return rooms[room] ? rooms[room].users : [];
  } catch (error) {
    return [];
  }
}

const changeStateInRoom = (user: User) => {
  try {
    switch (user.info.teamColor) {
      case 'red':
        if (((rooms[user.room].state as CaballosState).red) <= (CONFIG.x - (CONFIG.HorsesInitialX)))
          (rooms[user.room].state as CaballosState).red += tappingFactor;
        break;
      case 'green':
        if (((rooms[user.room].state as CaballosState).green) <= (CONFIG.x - (CONFIG.HorsesInitialX)))
          (rooms[user.room].state as CaballosState).green += tappingFactor;
        break;
      case 'blue':
        if (((rooms[user.room].state as CaballosState).blue) <= (CONFIG.x - (CONFIG.HorsesInitialX)))
          (rooms[user.room].state as CaballosState).blue += tappingFactor;
        break;
      case 'yellow':
        if (((rooms[user.room].state as CaballosState).yellow) <= (CONFIG.x - (CONFIG.HorsesInitialX)))
          (rooms[user.room].state as CaballosState).yellow += tappingFactor;
        break;
      case 'gray':
        if (((rooms[user.room].state as CaballosState).gray) <= (CONFIG.x - (CONFIG.HorsesInitialX)))
          (rooms[user.room].state as CaballosState).gray += tappingFactor;
        break;
      default:
        break;
    }
    return rooms[user.room].state

  } catch (error) {

  }
}

const getStateByRoom = (room_id: string): CaballosState | null => {
  try {
    return rooms[room_id] ? rooms[room_id].state : null;
  } catch (error) {
    return null;
  }
}

const getBestTeam = (room_id: string): string | null => {
  try {
    let bestTeam = ''
    let bestTeamPoint = 0
    const values = Object.values(rooms[room_id].state)
    const keys = Object.keys(rooms[room_id].state)

    for (let i = 0; i < 5; i++) {
      if (values[i] >= bestTeamPoint) {
        bestTeamPoint = values[i]
        bestTeam = keys[i]
      }

    }

    return bestTeam

  } catch (error) {
    return null;
  }
}

const getStatisticsByRoom = (room_id: string, winner: string): any | null => {
  try {
    const taps = rooms[room_id].tapsTimes;
    const finishTime: number = parseInt(rooms[room_id].finishTime ?? "0");
    const startTime: number = parseInt(rooms[room_id].startTime ?? "0");
    const state = rooms[room_id].state;
    

    const linearData: Array<any> = [['Intervalos'],];

    const inicio = (startTime / 1000);
    const gameTime = (finishTime / 1000) - inicio;
    const fin = gameTime;
    const series = 5;
    let cantidadJugadoresRojo = 0;
    let cantidadJugadoresVerde = 0;
    let cantidadJugadoresAmarillo = 0;
    let cantidadJugadoresAzul = 0;
    let cantidadJugadoresCafe = 0;
    const tiemposRojo = [];
    const tiemposVerde = [];
    const tiemposAmarillo = [];
    const tiemposAzul = [];
    const tiemposCafe = [];

    let MVP = { username: "", taps: 0 };

    for (const jugador of Object.keys(taps)) {
      const j: any = taps[jugador];
      const equipo: string = j.team;
      const tiempos: Array<number> = j.times;

      if (equipo === winner && tiempos.length > MVP.taps) {
        MVP.username = j.username;
        MVP.taps = tiempos.length;
      }

      switch (equipo) {
        case 'red': tiemposRojo.push(...tiempos); cantidadJugadoresRojo++; break;
        case 'yellow': tiemposAmarillo.push(...tiempos); cantidadJugadoresAmarillo++; break;
        case 'green': tiemposVerde.push(...tiempos); cantidadJugadoresVerde++; break;
        case 'blue': tiemposAzul.push(...tiempos); cantidadJugadoresAzul++; break;
        case 'gray': tiemposCafe.push(...tiempos); cantidadJugadoresCafe++; break;
        default: tiemposCafe.push(...tiempos); cantidadJugadoresCafe++; break;
      }
    }

    const tiemposWinner = [];
    let cantidadWinner = 0;
    switch (winner) {
      case 'red': tiemposWinner.push(...tiemposRojo); cantidadWinner = cantidadJugadoresRojo; break;
      case 'yellow': tiemposWinner.push(...tiemposAmarillo); cantidadWinner = cantidadJugadoresAmarillo; break;
      case 'green': tiemposWinner.push(...tiemposVerde); cantidadWinner = cantidadJugadoresVerde; break;
      case 'blue': tiemposWinner.push(...tiemposAzul); cantidadWinner = cantidadJugadoresAzul; break;
      case 'gray': tiemposWinner.push(...tiemposCafe); cantidadWinner = cantidadJugadoresCafe; break;
      default: tiemposWinner.push(...tiemposCafe); cantidadWinner = cantidadJugadoresCafe; break;
    }

    let j = 0;
    const tapsPorSegundo = [];
    const tiemposMapX = (tiemposWinner.map((num: number) => ((num / 1000) - inicio)));
    const maximo = Math.ceil(Math.max(...tiemposMapX));
    for (let i = 1; i <= maximo; i++) {
      let tiemposFiltrados = (tiemposMapX.filter((num: number) => (j <= num && num <= i)));
      tapsPorSegundo.push(tiemposFiltrados.length);
      j++;
    }
    const winnerStamp = { taps: 0, gameTime: 0, MVP: MVP, name: winner };
    winnerStamp.taps = tapsPorSegundo.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / cantidadWinner;
    winnerStamp.gameTime = parseFloat((Math.max(...tiemposMapX)).toFixed(2));

    j = 0;
    for (let i = (gameTime / series); i <= fin; i += (gameTime / series)) {
      const secuencia = [i];

      let tiemposMap = (tiemposRojo.map((num: number) => ((num / 1000) - inicio)));
      let tiemposFiltrados = (tiemposMap.filter((num: number) => (j <= num && (j <= num && num <= i))));
      if (cantidadJugadoresRojo > 0)
        secuencia.push(tiemposFiltrados.length / cantidadJugadoresRojo);
      else
        secuencia.push(0);

      tiemposMap = (tiemposVerde.map((num: number) => ((num / 1000) - inicio)));
      tiemposFiltrados = (tiemposMap.filter((num: number) => (j <= num && num <= i)));
      if (cantidadJugadoresVerde > 0)
        secuencia.push(tiemposFiltrados.length / cantidadJugadoresVerde);
      else
        secuencia.push(0);

      tiemposMap = (tiemposAzul.map((num: number) => ((num / 1000) - inicio)));
      tiemposFiltrados = (tiemposMap.filter((num: number) => (j <= num && num <= i)));
      if (cantidadJugadoresAzul > 0)
        secuencia.push(tiemposFiltrados.length / cantidadJugadoresAzul);
      else
        secuencia.push(0);

      tiemposMap = (tiemposAmarillo.map((num: number) => ((num / 1000) - inicio)));
      tiemposFiltrados = (tiemposMap.filter((num: number) => (j <= num && num <= i)));
      if (cantidadJugadoresAmarillo > 0)
        secuencia.push(tiemposFiltrados.length / cantidadJugadoresAmarillo);
      else
        secuencia.push(0);

      tiemposMap = (tiemposCafe.map((num: number) => ((num / 1000) - inicio)));
      tiemposFiltrados = (tiemposMap.filter((num: number) => (j <= num && num <= i)));
      if (cantidadJugadoresCafe > 0)
        secuencia.push(tiemposFiltrados.length / cantidadJugadoresCafe);
      else
        secuencia.push(0);

      j += (gameTime / series);

      linearData.push(secuencia);
    }

    linearData[0].push('Rojo');
    linearData[0].push('Verde');
    linearData[0].push('Azul');
    linearData[0].push('Amarillo');
    linearData[0].push('Rosa');

    const barData: Array<any> = [['Colores', 'Puntos', { role: 'style' }],];
    barData.push(['Rojo', state['red'] + (1/(((tiemposRojo[tiemposRojo.length - 1] - startTime)/10)/fin))*1000, 'color: red']);
    barData.push(['Verde', state['green'] + (1/(((tiemposVerde[tiemposVerde.length - 1] - startTime)/10)/fin))*1000, 'color: green']);
    barData.push(['Azul', state['blue'] + (1/(((tiemposAzul[tiemposAzul.length - 1] - startTime)/10)/fin))*1000, 'color: blue']);
    barData.push(['Amarillo', state['yellow'] + (1/(((tiemposAmarillo[tiemposAmarillo.length - 1] - startTime)/10)/fin))*1000, 'color: yellow']);
    barData.push(['Rosa', state['gray'] + (1/(((tiemposCafe[tiemposCafe.length - 1] - startTime)/10)/fin))*1000, 'color: pink']);

    return { gameData: { finishTime: finishTime, startTime: startTime }, barData: barData, linearData: linearData, winner: winnerStamp }
  } catch (error) {
    return null;
  }
}

const getNicknames = (): string => {
  let nickname = 'John Doe'
  const num = Math.floor(Math.random() * 100);
  if (num < 95) {
    nickname = NICKNAMES.SUJETOS[Math.floor(Math.random() * NICKNAMES.SUJETOS.length)] + ' ' + NICKNAMES.ADJETIVOS[Math.floor(Math.random() * NICKNAMES.ADJETIVOS.length)]
  } else {
    nickname = EASTER_EGG[Math.floor(Math.random() * EASTER_EGG.length)]
  }
  return nickname
}

const setConfigs = (room_id: string, caballosCount: number, titulo: string, descripcion: string, link: string): boolean => {
  try {
    rooms[room_id].caballosCount = caballosCount
    rooms[room_id].titulo = titulo
    rooms[room_id].descripcion = descripcion
    rooms[room_id].link = link
    return true
  } catch (e) {
    return false
  }
}

const getCaballosCount = (room_id: string): number => {
  try {
    return rooms[room_id].caballosCount ?? 5
  } catch (e) {
    return 5
  }
}

const setTeamsColor = (room_id: string, teamsColor: Array<string>): boolean => {
  try {
    rooms[room_id].teamsColor = teamsColor
    return true
  } catch (e) {
    return false
  }
}

const getTeamsColor = (room_id: string): Array<String> => {
  try {
    return rooms[room_id].teamsColor ?? ['red', 'green', 'blue', 'yellow', 'gray']
  } catch (e) {
    return ['red', 'green', 'blue', 'yellow', 'gray']
  }
}

const setTapsTimes = (room_id: string, user_id: string, username: string, team: string, tap: string) => {
  try {
    const user = rooms[room_id].tapsTimes[user_id]
    if (user) {
      user.times.push(tap)
    }
    else {
      rooms[room_id].tapsTimes[user_id] = {
        team: team,
        username: username,
        times: [tap]
      }
    }
  } catch (error) {

  }
}

const setStartTime = (room_id: string, time: string) => {
  try {
    rooms[room_id].startTime = time
  } catch (error) {

  }
}

const setFinishTime = (room_id: string, time: string) => {
  try {
    rooms[room_id].finishTime = time
  } catch (error) {

  }
}

export default {
  setWinnerInState,
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  getStateByRoom,
  changeStateInRoom,
  addRoom,
  getRoom,
  getNicknames,
  initTappingFactor,
  getIDTeamLessPlayers,
  setConfigs,
  getCaballosCount,
  setTeamsColor,
  getTeamsColor,
  setTapsTimes,
  setStartTime,
  setFinishTime,
  getViewer,
  getStatisticsByRoom,
  getBestTeam,
  isEveryoneFinished
};