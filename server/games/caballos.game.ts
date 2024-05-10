import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

import GameManager from "../utils/manager.util";
import { User } from "../types/User";
import { CaballosState } from "../types/CaballosState";

const initCaballos = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {

  const teamsColor = ['red', 'green', 'blue', 'yellow', 'gray']

  //Namespace caballos
  const caballosNSP = io.of("/caballos");

  caballosNSP.on("connection", caballosSocket => {

    //Admin crea una sala
    caballosSocket.on('join-admin', () => {
      const room = `cblls-${caballosNSP.adapter.rooms.size}`
      GameManager.addRoom(room, { red: 0, green: 0, blue: 0, yellow: 0, gray: 0 } as CaballosState)

      const user: User = {
        id: caballosSocket.id,
        username: 'Admin',
        room,
        isAdmin: true,
        info: {
          teamColor: ''
        }
      };

      GameManager.addUser(user)
      caballosSocket.join(room)

      caballosNSP.to(user.id).emit("user-info", user)

      console.log("USERS IN ROOM");
      console.log(GameManager.getUsersInRoom(room));
      console.log("ROOMS");
      console.log(caballosNSP.adapter.rooms);

    });

    // Jugador entra a la sala del admin
    caballosSocket.on('join-player', (room) => {
      try {
        //Añade al usuario, si la room no ha sido creada este usuario es admin
        const user: User = {
          id: caballosSocket.id,
          username: `user#${caballosSocket.id}`,
          room,
          isAdmin: false,
          info: {
            teamColor: teamsColor[GameManager.getUsersInRoom(room).length % 5 - 1]
          }
        };

        GameManager.addUser(user)
        caballosSocket.join(room)

        caballosNSP.to(user.id).emit("user-info", user)

        const roomAdmin = GameManager.getUsersInRoom(room).find((user: User) => user.isAdmin)
        // Usuario caballosSocket se ha conectado a la room
        caballosNSP.to(room).to(roomAdmin!.id).emit('connect-to-caballos', {
          msg: `User ${user.username} has connected!`,
          users: GameManager.getUsersInRoom(room)
        });
      } catch (error) {
        console.log(error)
      }
    })

    // Admin inicia el juego
    caballosSocket.on("join-viewer", ({ viewer, room }: { viewer: string, room: string }) => {
      const user: User = {
        id: caballosSocket.id,
        username: viewer,
        room,
        isAdmin: false,
        info: {
          teamColor: ''
        }
      };

      GameManager.addUser(user)
      caballosSocket.join(room)
      caballosNSP.to(user.id).emit("user-info", user)

      caballosNSP.to(user.room).emit("start-game")
    })

    caballosSocket.on("tapping", (user: User) => {
      GameManager.changeStateInRoom(user)
      caballosNSP.to(user.room).emit("new-state", GameManager.getStateByRoom(user))
    })

    caballosSocket.on("disconnect", () => {
      console.log("usuario desconectado de nsp caballos");
    })

  });

}

export default initCaballos