import { CaballosState } from "./CaballosState";
import { User } from "./User";

export interface Rooms {
    [roomid: string]: {
        users: Array<User>,
        state: CaballosState,
        titulo?: string,
        descripcion?: string,
        link?: string,
        caballosCount?: number,
        teamsColor: Array<string>,
        teamsPlayerCount: Array<number>,
        startTime?: string,
        finishTime?: string,
        tapsTimes: {
            [userid: string]: {
                username: string,
                team: string,
                times: Array<string>,
            },
        },
    },
}
