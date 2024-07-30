import { createServer } from "http";
import { Server } from "socket.io";
import initCaballos from "./games/caballos.game";
import { instrument } from "@socket.io/admin-ui";

const port = process.env.PORT ?? 3000

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true
  }
})

instrument(io, {
  auth: false,
});

// Se inicializa el juego Caballos
initCaballos(io)

httpServer.listen(port, () => {
  console.log(`Escuchando en puerto ${port}`);
})