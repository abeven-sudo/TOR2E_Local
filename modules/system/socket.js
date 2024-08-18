import SocketHandlers from "./SocketHandlers.js";

export default function activateSocketListener() {

    game.socket.on("system.tor2e", data => {
        SocketHandlers[data.type](data)
    })
}