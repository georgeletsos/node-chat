/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "MainWorker" }] */

/** Class representing a web worker instance of the main thread. */
class MainWorker {
  /**
   * @param {String} workerURL
   */
  constructor(workerURL) {
    this.worker = new Worker(workerURL);
    this.callbacks = [];
    this.generateId = this.idGenerator();

    this.onMessage = this.onMessage.bind(this);
    this.worker.addEventListener("message", this.onMessage);
  }

  /**
   * Unique id generator function.
   * @yields {Number} A unique id.
   */
  *idGenerator() {
    let id = 0;

    while (true) {
      yield id++;
    }
  }

  /**
   * Called when the worker thread passes the result of a completed job
   * back to the main thread.
   * Finds and runs the right callback, based on the message id.
   * @param {Event} e
   */
  onMessage(e) {
    let message = e.data;
    let id = message.id;
    let error = message.error;
    let result = message.data;

    let callbackIndex = this.callbacks.findIndex(
      callback => callback.id === id
    );
    let callback = this.callbacks[callbackIndex];
    if (!callback) {
      return;
    }

    this.callbacks.splice(callbackIndex, 1);
    callback.fn(error, result);
  }

  /**
   * Passes a job to the worker thread.
   * Saves a callback, matched to an id,
   * so that it knows what to do when the worker thread passes back the result.
   * @param {Object} message
   * @returns {Promise} A promise that is resolved with the result or rejected with an error.
   */
  postMessage(message) {
    let id = this.generateId.next().value;
    message.id = id;

    return new Promise((resolve, reject) => {
      this.callbacks.push({
        id,
        fn: (error, result) => {
          if (error) {
            return reject(new Error(error));
          }
          resolve(result);
        }
      });

      this.worker.postMessage(message);
    });
  }
}
