import { CaballosState } from "../types/CaballosState";
import { User } from "../types/User";
import { Users } from "../types/Users";

const rooms: Users = {};

const addRoom = (room: string, state: CaballosState) => {
  rooms[room] = {
    users: [],
    state: state
  }
}

const addUser = (userInfo: User) => {
  //Check if room is null
  // const existingUser = rooms[userInfo.room].users.find((user) => {
  //   user.room === userInfo.room && user.username === userInfo.username
  // });

  // if (existingUser) {
  //   return { error: "Username is taken" };
  // }

  const user = userInfo;
  rooms[userInfo.room].users.push(user);
  return { user };
}

const removeUser = (id: string, room: string) => {
  const index = rooms[room].users.findIndex((user) => {
    user.id === id
  });

  if (index !== -1) {
    return rooms[room].users.splice(index, 1)[0];
  }
}

const getUser = (id: string, room: string) => rooms[room].users.find((user) => user.id === id);

const getUsersInRoom = (room: string) => rooms[room] ? rooms[room].users : [];

const changeStateInRoom = (user: User) => {
  switch (user.info.teamColor) {
    case 'red':
      (rooms[user.room].state as CaballosState).red += 2
      break;
    case 'green':
      (rooms[user.room].state as CaballosState).green += 2
      break;
    case 'blue':
      (rooms[user.room].state as CaballosState).blue += 2
      break;
    case 'yellow':
      (rooms[user.room].state as CaballosState).yellow += 2
      break;
    case 'gray':
      (rooms[user.room].state as CaballosState).gray += 2
      break;
    default:
      break;
  }
}

const getStateByRoom = (user: User) => rooms[user.room].state

export default {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  getStateByRoom,
  changeStateInRoom,
  addRoom,
};