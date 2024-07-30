import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

import GameManager from "../utils/manager.util";
import { User } from "../types/User";
import { CaballosState } from "../types/CaballosState";
import { CONFIG } from '../global';
const crypto = require('crypto');

function generateNumericCode(length: number) {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    code += digits[randomIndex];
  }
  return code;
}

const initCaballos = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {

  const teamsColorOG = ['red', 'green', 'blue', 'yellow', 'gray']
  const teamsPlayerCountOG = [0, 0, 0, 0, 0]

  let teamsColor = ['red', 'green', 'blue', 'yellow', 'gray']
  let teamsPlayerCount = [0, 0, 0, 0, 0]

  //Namespace caballos
  const caballosNSP = io.of("/caballos");

  caballosNSP.on("connection", caballosSocket => {
    let userRoom: string | undefined;

    //Admin crea una sala
    caballosSocket.on('join-admin', () => {
      const room = `cblls-${caballosNSP.adapter.rooms.size}${generateNumericCode(7)}`
      GameManager.addRoom(room, { red: 0, green: 0, blue: 0, yellow: 0, gray: 0 } as CaballosState)

      const user: User = {
        id: caballosSocket.id,
        username: 'Admin',
        room,
        isAdmin: true,
        info: {
          teamColor: '',
          taps: 0,
        }
      };

      if (GameManager.addUser(user)) {
        caballosSocket.join(room)

        caballosNSP.to(user.id).emit("user-info", user)
      }

    });

    // Jugador entra a la sala del admin
    caballosSocket.on('join-player', (roomID: string) => {
      try {
        userRoom = roomID
        const colorID = GameManager.getIDTeamLessPlayers(teamsPlayerCount)
        const room = GameManager.getRoom(roomID)

        teamsPlayerCount[colorID] += 1

        const user: User = {
          id: caballosSocket.id,
          username: GameManager.getNicknames(),
          room: roomID,
          isAdmin: false,
          info: {
            teamColor: teamsColor[colorID],
            taps: 0,
            titulo: room != null && room.titulo != undefined ? room.titulo : 'Gracias por participar',
            descripcion: room != null && room.descripcion != undefined ? room.descripcion : 'Por favor llena el siguiente formulario para ayudarnos a mejorar Momentum',
            link: room != null && room.link != undefined ? room.link : 'https://docs.google.com/forms/d/e/1FAIpQLSefjm1myoJiP4PByTaRHZq2CPaWz4EtdubVIrMJ_N1nDfLP6g/viewform',
          }
        };

        if (GameManager.addUser(user)) {
          caballosSocket.join(roomID)

          caballosNSP.to(user.id).emit("user-info", user)

          const roomAdmin = GameManager.getUsersInRoom(roomID).find((user: User) => user.isAdmin)
          // Usuario caballosSocket se ha conectado a la room
          caballosNSP.to(roomID).to(roomAdmin!.id).emit('connect-to-caballos', {
            msg: `User ${user.username} has connected!`,
            users: GameManager.getUsersInRoom(roomID)
          });
        }
      } catch (error) {
      }
    })

    // Admin inicia el juego (Ventana del juego)
    caballosSocket.on("join-viewer", ({ viewer, room }: { viewer: string, room: string }) => {
      const playersCount = GameManager.getUsersInRoom(room).length
      const caballosCount = GameManager.getCaballosCount(room)
      const teamsColor = GameManager.getTeamsColor(room)

      userRoom = room
      const user: User = {
        id: caballosSocket.id,
        username: viewer,
        room,
        isAdmin: false,
        info: {
          teamColor: '',
          taps: 0,
          playersCount,
          caballosCount,
          teamsColor
        }
      };

      GameManager.initTappingFactor(room)

      if (GameManager.addUser(user)) {
        caballosSocket.join(room)
        caballosNSP.to(user.id).emit("user-info", user)
      }
    })

    caballosSocket.on('set-config', ({ room_id, configs }) => {
      GameManager.setConfigs(room_id, configs['caballosCount'], configs['titulo'], configs['descripcion'], configs['link'])

      if (configs['caballosCount'] != 5) {
        const shuffledArray = [...teamsColorOG];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }

        teamsColor = shuffledArray.slice(0, configs['caballosCount']);
        teamsPlayerCount = [...teamsPlayerCountOG].slice(0, configs['caballosCount']);
      } else {
        teamsColor = teamsColorOG;
        teamsPlayerCount = teamsPlayerCountOG;
      }
      GameManager.setTeamsColor(room_id, teamsColor)
    })

    caballosSocket.on("tapping", (user: User) => {
      GameManager.getStateByRoom(user.room);
      GameManager.setTapsTimes(user.room, user.id, user.username, user.info.teamColor, Date.now() + '');
      const newState = GameManager.changeStateInRoom(user)
      if (newState) {
        caballosNSP.to(user.room).emit("new-state", GameManager.getStateByRoom(user.room))

        if (GameManager.isEveryoneFinished(newState, user.room)) {
          GameManager.setFinishTime(user.room, Date.now() + '')
          caballosNSP.to(user.room).emit("viewer-statistics", { winner: newState.winner, gameState: GameManager.getStatisticsByRoom(user.room, newState.winner!) })
          caballosNSP.to(user.room).emit("finish-game", { winner: newState.winner, gameState: GameManager.getStateByRoom(user.room) })
          console.log(GameManager.getRoom(user.room));

          return
        }

        if (newState.blue >= CONFIG.x - (2 * CONFIG.HorsesInitialX)) {
          GameManager.setWinnerInState('blue', user.room)
          caballosNSP.to(user.room).emit("one-finish-game", { gameState: GameManager.getStateByRoom(user.room) })
          // GameManager.setFinishTime(user.room, Date.now() + '')
          // caballosNSP.to(user.room).emit("viewer-statistics", { winner: 'blue', gameState: GameManager.getStatisticsByRoom(user.room, 'blue') })
          // caballosNSP.to(user.room).emit("finish-game", { winner: 'blue', gameState: GameManager.getStateByRoom(user.room) })
        } else if (newState.gray >= CONFIG.x - (2 * CONFIG.HorsesInitialX)) {
          GameManager.setWinnerInState('gray', user.room)
          caballosNSP.to(user.room).emit("one-finish-game", { gameState: GameManager.getStateByRoom(user.room) })
          // GameManager.setFinishTime(user.room, Date.now() + '')
          // caballosNSP.to(user.room).emit("viewer-statistics", { winner: 'gray', gameState: GameManager.getStatisticsByRoom(user.room, 'gray') })
          // caballosNSP.to(user.room).emit("finish-game", { winner: 'gray', gameState: GameManager.getStateByRoom(user.room) })
        } else if (newState.green >= CONFIG.x - (2 * CONFIG.HorsesInitialX)) {
          GameManager.setWinnerInState('green', user.room)
          caballosNSP.to(user.room).emit("one-finish-game", { gameState: GameManager.getStateByRoom(user.room) })
          // GameManager.setFinishTime(user.room, Date.now() + '')
          // caballosNSP.to(user.room).emit("viewer-statistics", { winner: 'green', gameState: GameManager.getStatisticsByRoom(user.room, 'green') })
          // caballosNSP.to(user.room).emit("finish-game", { winner: 'green', gameState: GameManager.getStateByRoom(user.room) })
        } else if (newState.red >= CONFIG.x - (2 * CONFIG.HorsesInitialX)) {
          GameManager.setWinnerInState('red', user.room)
          caballosNSP.to(user.room).emit("one-finish-game", { gameState: GameManager.getStateByRoom(user.room) })
          // GameManager.setFinishTime(user.room, Date.now() + '')
          // caballosNSP.to(user.room).emit("viewer-statistics", { winner: 'red', gameState: GameManager.getStatisticsByRoom(user.room, 'red') })
          // caballosNSP.to(user.room).emit("finish-game", { winner: 'red', gameState: GameManager.getStateByRoom(user.room) })
        } else if (newState.yellow >= CONFIG.x - (2 * CONFIG.HorsesInitialX)) {
          GameManager.setWinnerInState('yellow', user.room)
          caballosNSP.to(user.room).emit("one-finish-game", { gameState: GameManager.getStateByRoom(user.room) })
          // GameManager.setFinishTime(user.room, Date.now() + '')
          // caballosNSP.to(user.room).emit("viewer-statistics", { winner: 'yellow', gameState: GameManager.getStatisticsByRoom(user.room, 'yellow') })
          // caballosNSP.to(user.room).emit("finish-game", { winner: 'yellow', gameState: GameManager.getStateByRoom(user.room) })
        }
      }
    })

    caballosSocket.on('end-game', (room_id) => {
      console.log(GameManager.getRoom(room_id));
      GameManager.setFinishTime(room_id, Date.now() + '')
      caballosNSP.to(room_id).emit("viewer-statistics", { winner: GameManager.getBestTeam(room_id), gameState: GameManager.getStatisticsByRoom(room_id, GameManager.getBestTeam(room_id)!) })
      // caballosNSP.to(room_id).emit("finish-game", { winner: GameManager.getBestTeam(room_id), gameState: GameManager.getStatisticsByRoom(room_id, GameManager.getBestTeam(room_id)!)})
    })

    caballosSocket.on("disconnect", () => {
      if (typeof userRoom === 'string') {
        const user = GameManager.removeUser(caballosSocket.id, userRoom!)
        if (user) {
          const colorID = teamsColor.findIndex((value) => value === user.info.teamColor)
          teamsPlayerCount[colorID] -= 1

          const roomAdmin = GameManager.getUsersInRoom(userRoom).find((user: User) => user.isAdmin)

        }
      }
    })

    caballosSocket.on("start-game", (roomId: string) => {
      GameManager.setStartTime(roomId, Date.now() + '')
      caballosNSP.to(roomId).emit("start-game")
    })

  });

}

export default initCaballos