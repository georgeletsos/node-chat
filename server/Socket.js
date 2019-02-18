/**
 * @typedef {import("http").Server} httpServer
 * @typedef {import("mongoose")} mongoose
 * @typedef {import("socket.io")} socketio
 * @typedef {import("socket.io").Server} socketioServer
 * @typedef {import("./models/User")} User
 * @typedef {import("./models/Chat")} Chat
 */

/**
 * @typedef {Object} Socket
 * @property {socketioServer} io
 */

/**
 * @const
 * @type {socketio}
 */
const socketio = require("socket.io");

/**
 * @const
 * @type {mongoose}
 */
const mongoose = require("mongoose");

/**
 * @const
 * @type {User}
 */
const User = require("./models/User");

/**
 * @const
 * @type {Chat}
 */
const Chat = require("./models/Chat");

/** Class representing our Socket implementation. */
module.exports = class Socket {
  /**
   * Start with connecting to MongoDB.
   * Initialize a new instance of socket.io with the `server`.
   * Listen on the websocket connect event.
   * @param {httpServer} server
   */
  async connect(server) {
    await mongoose.connect("mongodb://localhost:27017/node-chat", {
      useNewUrlParser: true
    });

    /**
     * Instance of Socket.io Server.
     * @type {socketioServer}
     */
    this.io = socketio(server).on("connect", socket => this.onConnect(socket));
  }

  /**
   * Handle a websocket connection between a specific chat and a specific user.
   * Start by finding the specific chat and the specific user in the database.
   * If the user is not already in the chat, add the user to the chat.
   * Add the websocket to the room of the specific chat.
   * Emit to every websocket in the chat room that the user has just been connected.
   * Finally listen to the websocket disconnect event:
   * when the user has been disconnected, remove the user from the list of users of the chat
   * and emit to every websocket in chat the room that the user has been disconnected.
   * @param {Object} socket The connected websocket.
   * @param {string} socket.chatId The specific chat id.
   * @param {string} socket.userId The specific user id.
   */
  async onConnect(socket) {
    let chatId = socket.handshake.query.chatId,
      userId = socket.handshake.query.userId;

    if (
      !mongoose.Types.ObjectId.isValid(chatId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return;
    }

    let chat = await Chat.findById(chatId).populate("users");
    if (!chat) {
      return;
    }

    let user = await User.findById(userId);
    if (!user) {
      return;
    }

    let chatUser = chat.users.find(chatUser => chatUser._id.equals(user._id));
    if (!chatUser) {
      chat.users.push(user);

      await chat.save();
    }

    /** Add the websocket to the room of the chat. */
    socket.join(chatId);

    /** Emit to every websocket in the chat room, that the user has been connected. */
    this.io.to(chatId).emit("userConnected", user.toClientObject());

    /** Listen to the websocket disconnect event. */
    socket.on("disconnect", async () => {
      /** Remove the user from the list of users of the chat. */
      let chatuserIndex = chat.users.findIndex(chatUser =>
        chatUser._id.equals(user._id)
      );
      if (chatuserIndex > -1) {
        chat.users.pull(user._id);

        await chat.save();
      }

      /** Emit to every websocket in the chat room, that the user has been disconnected. */
      this.io.to(chatId).emit("userDisconnected", user.toClientObject());
    });
  }
};
