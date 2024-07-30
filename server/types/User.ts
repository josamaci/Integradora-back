export interface User {
    id: string,
    username: string,
    room: string,
    isAdmin: boolean,
    info: {
        teamColor: string,
        taps: number,
        titulo?: string,
        descripcion?: string,
        link?: string,
        playersCount?: number,
        caballosCount?: number,
        teamsColor?: Array<String>,
    }
}