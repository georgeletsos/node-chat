/**
 * @typedef {import("mongoose").Mongoose} mongoose
 * @typedef {import("mongoose").Schema} mongooseSchema
 * @typedef {import("mongoose").Query} mongooseQuery
 */

/**
 * @const
 * @type {mongoose}
 */
const mongoose = require("mongoose");

/**
 * @const
 * @type {mongooseSchema}
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tag: { type: Number, required: true }
  },
  { timestamps: { updatedAt: null } }
);

/**
 * Transform the output of `toObject` further, as to send to client only the info it needs.
 * @returns {Object} A `User` with the only info that we need to show to the client.
 */
userSchema.methods.toClientObject = function() {
  return this.toObject({
    transform: function(doc, ret, options) {
      return {
        id: ret._id,
        name: ret.name,
        tag: ret.tag
      };
    }
  });
};

/**
 * Make the output of the above `toClientObject` into JSON.
 * @returns {JSON}
 */
userSchema.methods.toClientJSON = function() {
  return JSON.stringify(this.toClientObject());
};

/**
 * Find the most recently added User.
 * @returns {mongooseQuery}
 */
userSchema.statics.getLatestUser = function() {
  return this.findOne().sort({ createdAt: -1 });
};

/** Class representing our User model. */
class User extends mongoose.model {
  constructor() {
    super("User", userSchema);
  }
}

module.exports = new User();
