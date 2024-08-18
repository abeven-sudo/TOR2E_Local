import * as chatHooks from "../chat/chat.js"
import * as hotbarHooks from "../macro/hotbarDrop.js"
import {Tor2eTokenHudExtension} from "../hud/Tor2eTokenHudExtension.js";

export default function registerHooks() {
    Tor2eTokenHudExtension.default();
    chatHooks.default();
    hotbarHooks.default();
}