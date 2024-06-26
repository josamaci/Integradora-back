export interface User {
    id: string,
    username: string,
    room: string,
    isAdmin: boolean,
    info: {
        teamColor: string
    }
}