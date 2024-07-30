export interface CaballosState {
    gray: number,
    red: number,
    green: number,
    blue: number,
    yellow: number,
    winner?: string
    loser?: string
    isReadyToStarted?: boolean,
    hasStopped?: boolean,
    hasStarded?: boolean,
    hasFinished?: boolean
}