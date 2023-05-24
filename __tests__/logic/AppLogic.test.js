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
 * Filename: AppLogic.test.js
 * Description: Tests addition and removal of helpers by creating multiple test helpers.
 * Author: Dipti Mahamuni
 */

import { AppLogic } from "../../logic/AppLogic";
import { User } from "../../logic/User";
import { OperatingModes } from "../../logic/Constants";
import { HelperStates, Helper } from "../../logic/Helper";
/*
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: (key) => {
    return new Promise((resolve) => {
      resolve(null);
    });
  },

  setItem: (key, value) => {
    return new Promise((resolve) => {
      resolve(null);
    });
  },
}));
*/

// const eventConsumedCalllback = jest.fn();
const callbacks = {
  // WorkItemProcessed: eventConsumedCalllback,
  updateZuestandState: jest.fn,
};
var appLogic;
const testHelpers = [
  { user: { name: "Alice", phone: "11" }, mode: OperatingModes.Normal, state: HelperStates.Pending },
  { user: { name: "Bob", phone: "22" }, mode: OperatingModes.Normal, state: HelperStates.Pending },
  { user: { name: "Carol", phone: "33" }, mode: OperatingModes.Recovery, state: HelperStates.Pending },
  { user: { name: "Dave", phone: "44" }, mode: OperatingModes.Recovery, state: HelperStates.Pending },
];

beforeAll(async () => {
  log = {};
  ["trace", "info", "keepAlive", "pairing", "recovery", "lockbox", "error"].forEach((level) => {
    log[level] = jest.fn();
  });
  global.log = log;
});

beforeEach(async () => {
  const user = new User("Alice", "111 222 3333");
  appLogic = await new AppLogic(callbacks);
  // appLogic.disconnectSockServer();
});

describe("<AppLogic />", () => {
  // it("processes 1 event", async () => {
  //   const workItem = { eventId: 100, eventName: "Dummy", eventData: null };
  //   appLogic.processEvent(workItem);
  //   expect(eventConsumedCalllback).toHaveBeenCalled();
  // });
  // it("callback is called with the right parameter", async () => {
  //   const workItem = { eventId: 123, eventName: "Dummy", eventData: null };
  //   appLogic.processEvent(workItem);
  //   expect(eventConsumedCalllback).toBeCalledWith(123);
  // });
  it("helper list is empty", async () => {
    const state = appLogic.appState();
    expect(state.helpers.length).toEqual(0);
  });
  it("adds helpers correctly", async () => {
    for (const index in testHelpers) {
      appLogic.addHelper(testHelpers[index].user.name, testHelpers[index].user.phone, testHelpers[index].mode, testHelpers[index].state);
      const state = appLogic.appState();
      expect(state.helpers.length).toEqual(+index + 1);
    }
    const state = appLogic.appState();
    for (const index in testHelpers) {
      expect(state.helpers[index].user.name).toEqual(testHelpers[index].user.name);
    }
  });
  it("removes helpers correctly", async () => {
    for (const index in testHelpers) {
      appLogic.addHelper(testHelpers[index].user.name, testHelpers[index].user.phone, testHelpers[index].mode, testHelpers[index].state);
    }
    for (const index in testHelpers) {
      appLogic.removeHelperByPhone(testHelpers[index].user.phone);
      const state = appLogic.appState();
      expect(state.helpers.length).toEqual(testHelpers.length - index - 1);
    }
    const state = appLogic.appState();
    expect(state.helpers.length).toEqual(0);
  });
});
