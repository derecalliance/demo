/*
 * Copyright (C) 2023 Swirlds Labs Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Filename: Sock.js
 * Description: Creates a socket.io connection to a server, and contains logic to send messages.
 * Author: Dipti Mahamuni
 */

import io from "socket.io-client";

export class Sock {
  constructor(serverLink) {
    this.serverLink = serverLink;
  }

  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }

  connect() {
    this.socket = io(this.serverLink, {
      transports: ["websocket"],
    });

    this.socket.io.on("open", () => {
      this.hasConnection = true;
      console.log(`socket connected`);
    });
    this.socket.io.on("close", () => {
      this.hasConenction = false;
      console.log(`socket disconnected`);
    });

    this.socket.on("message", (m) => {
      this.callbacks["MessageReceived"](m);
    });
  }

  disconnect() {
    this.socket.disconnect();
    this.socket.removeAllListeners();
  }

  send(type, data) {
    this.socket.emit(type, data);
  }
}
