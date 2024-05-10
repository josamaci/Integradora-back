import { createServer } from "http";
import { Server } from "socket.io";
import initCaballos from "./games/caballos.game";

const port = process.env.PORT ?? 3000

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: true
  }
})

// Se inicializa el juego Caballos
initCaballos(io)

httpServer.listen(port, () => {
  console.log(`Escuchando en puerto ${port}`);
})