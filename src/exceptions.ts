/**
 * Custom exceptions for the La Marzocco package
 */

/**
 * Base exception for La Marzocco errors
 */
export class LaMarzoccoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LaMarzoccoError";
    Object.setPrototypeOf(this, LaMarzoccoError.prototype);
  }
}

/**
 * Error indicating invalid authentication information
 */
export class AuthFail extends LaMarzoccoError {
  constructor(message: string = "Authentication failed") {
    super(message);
    this.name = "AuthFail";
    Object.setPrototypeOf(this, AuthFail.prototype);
  }
}

/**
 * Error indicating a non-200 HTTP response
 */
export class RequestNotSuccessful extends LaMarzoccoError {
  constructor(message: string = "Request was not successful") {
    super(message);
    this.name = "RequestNotSuccessful";
    Object.setPrototypeOf(this, RequestNotSuccessful.prototype);
  }
}

/**
 * Error indicating an unknown WebSocket message was received
 */
export class UnknownWebSocketMessage extends LaMarzoccoError {
  constructor(message: string = "Received unknown websocket message") {
    super(message);
    this.name = "UnknownWebSocketMessage";
    Object.setPrototypeOf(this, UnknownWebSocketMessage.prototype);
  }
}

/**
 * Error indicating functionality requires cloud client but it's not initialized
 */
export class CloudOnlyFunctionality extends LaMarzoccoError {
  constructor() {
    super("Functionality is cloud only, but cloud client not initialized.");
    this.name = "CloudOnlyFunctionality";
    Object.setPrototypeOf(this, CloudOnlyFunctionality.prototype);
  }
}

/**
 * Error raised when functionality is only available on certain models
 */
export class UnsupportedModel extends LaMarzoccoError {
  constructor(message: string = "Operation not supported on this model") {
    super(message);
    this.name = "UnsupportedModel";
    Object.setPrototypeOf(this, UnsupportedModel.prototype);
  }
}

