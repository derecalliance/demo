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
 * Filename: index.js
 * Description: Express server that receives derec messages from one user and sends it to another.
 * Author: Dipti Mahamuni
 */
const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const directory = {};

let showMessagesFlag = false;

// Add messages when sockets open and close connections
io.on("connection", (socket) => {
  console.log(`[${socket.id}] socket connected`);

  socket.on("disconnect", (reason) => {
    console.log(`[${socket.id}] socket disconnected - ${reason}`);
  });

  socket.on("register", (message) => {
    console.log(`register received for ${JSON.stringify(message)} on socket id ${socket.id}`);
    directory[message.phone] = {
      username: message.name,
      phone: message.phone,
      socket: socket,
    };
  });

  socket.on("message", (message) => {
    relay(socket, "message", message);
  });

  function relay(socket, type, message) {
    if (showMessagesFlag) {
      console.log(`Message recd: ${JSON.stringify(message)}`);
    }

    if (message.toPhone && directory[message.toPhone]) {
      directory[message.toPhone].socket.emit(type, message);
    } else {
      console.log(`could not relay message: ${JSON.stringify(message)} `);
    }
  }
});

// Show the index.html by default
app.get("/", (req, res) => res.sendFile("index.html"));
app.get("/show", (req, res) => {
  showMessagesFlag = true;
  res.send("Showing the messages now");
});
app.get("/hide", (req, res) => {
  showMessagesFlag = false;
  res.send("Hiding the messages now");
});

// Start the express server
http.listen(3000, function () {
  console.log("listening on *:3000");
});
