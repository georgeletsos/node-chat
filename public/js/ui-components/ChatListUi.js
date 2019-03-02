/* global UiComponent */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "ChatListUi" }] */

/** Class representing the chat list component. */
class ChatListUi extends UiComponent {
  /**
   * @param {AppWorker} appWorker The web worker instance of our main thread.
   * @param {String} chatId The current chat id that comes from the page URL.
   */
  constructor(appWorker, chatId) {
    super(document.getElementById("chats-container"), appWorker);

    this.chatId = chatId;

    this.onSocketChatCreated = this.onSocketChatCreated.bind(this);

    /** Main DOM elements of component. */
    this.$chats = document.getElementById("chats");
  }

  /**
   * Initializes the component, by setting up socket event listeners
   * and drawing the list of chats.
   */
  async init() {
    this.setUpSocketEventListeners();

    /** Make an API call to get the list of chats. */
    await this.appWorker
      .postMessage({
        op: "getChats"
      })
      .then(chats => {
        this.drawChats(chats);
        this.show();
      });
  }

  setUpSocketEventListeners() {
    document.addEventListener("socketChatCreated", this.onSocketChatCreated);
  }

  /**
   * Called when the socket informs that a new chat has been created.
   * Draws that new chat in the list.
   * @param {Event} e
   */
  onSocketChatCreated(e) {
    this.drawChats([e.detail.chat]);
  }

  /**
   * Draws a list of chats.
   * @param {Object[]} chats A list of chats.
   * @param {String} chats[].id
   * @param {String} chats[].name
   */
  drawChats(chats) {
    for (let chat of chats) {
      let $li = document.createElement("li"),
        $div = document.createElement("div"),
        $hash = document.createElement("span"),
        $chatName = document.createElement("span");

      $li.classList.add("py-1");

      $div.classList.add("p-2", "rounded-lg", "select-none");

      $hash.classList.add("mr-1", "text-base", "text-white", "opacity-50");

      $hash.textContent = "#";

      $div.appendChild($hash);

      $chatName.classList.add("text-base", "text-white");

      $chatName.textContent = chat.name;

      $div.appendChild($chatName);

      /**
       * If the iterated chat isn't the same as the current chat,
       * draw a `a.href` element instead.
       */
      if (this.chatId === chat.id) {
        $div.classList.add("bg-grey-light");

        $li.appendChild($div);
      } else {
        $div.classList.add("hover:bg-grey-darker");

        let $a = document.createElement("a");

        $a.classList.add("no-underline");

        $a.setAttribute("href", "/" + chat.id);

        $a.appendChild($div);

        $li.appendChild($a);
      }

      this.$chats.appendChild($li);
    }
  }
}
