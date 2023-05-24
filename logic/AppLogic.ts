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
 * Filename: AppLogic.tsx
 * Description: Contains logic to process messages, and make changes to the application's state.
 * Also handles distribution of lockbox contents when the list of helpers or accounts changes.
 * Author: Dipti Mahamuni
 */

import { CallbackFunctions } from "./CallbackFunctions";
import { Sock } from "./Sock";
import { User } from "./User";
import { Helper, HelperStates } from "./Helper";
import { Account } from "./Account";
import { OperatingModes, PauseModes, Constants } from "./Constants";
import { Message, MessageTypes } from "./Message";
import { IKey } from "./Key";
import { IVault } from "./Vault";
import { AccountVault } from "./AccountVault";
import { LockboxShares } from "./LockboxShares";
import { PairingHandshakePacketData } from "./PairingSession";
import { SERVER_LINK } from "../env";

export type TNotification = {
  ts: number;
  title: string;
  description: string;
};

export interface AppStateInterface {
  user: User;
  appFlags: {
    operatingMode: OperatingModes;
    pauseMode: PauseModes;
  };
  qrCodesData: Array<Array<number>>;
  vault: IVault;
  helpers: Array<Helper>;
  notifications: Array<TNotification>;
}

export class AppLogic {
  user: User;
  callbacks: CallbackFunctions;
  sock: Sock;
  appFlags: any;

  qrCodesData: Array<Array<number>>;

  vault: IVault;
  lockboxShares: LockboxShares;

  helpers: Array<Helper>;
  notifications: Array<TNotification>;

  constructor(callbacks: CallbackFunctions) {
    if (SERVER_LINK == undefined) {
      const errMsg = `Server link is not defined. Please enter server link in the env.ts file. Example: SERVER_LINK="http://127.0.0.1:3000"`;
      global.log.error(errMsg);
      throw errMsg;
    }
    this.callbacks = { ...callbacks };
    this.vault = new AccountVault();
    this.helpers = [];
    this.appFlags = { operatingMode: OperatingModes.Normal, pauseMode: PauseModes.Active };
    this.setOperatingMode(OperatingModes.Normal);
    this.notifications = [];

    this.connectSockServer();

    global.log.keepAlive("message"); // correct log call
  }

  setCallbacks(callbacks: CallbackFunctions) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  connectSockServer() {
    this.sock = new Sock(SERVER_LINK);
    this.sock.setCallbacks({ ...this.callbacks, MessageReceived: (m) => this.processSockMessage(m) });
    this.sock.connect();
  }

  disconnectSockServer() {
    this.sock.disconnect();
  }

  setUser(name: string, phone: string) {
    this.user = new User(name, phone);
    this.register();
  }
  getUser(): User {
    return this.user;
  }

  setOperatingMode(operatingMode: OperatingModes) {
    this.appFlags.operatingMode = operatingMode;
    this.lockboxShares = new LockboxShares(operatingMode);
  }
  getOperatingMode(): OperatingModes {
    return this.appFlags.operatingMode;
  }
  togglePauseMode() {
    this.appFlags.pauseMode = this.appFlags.pauseMode == PauseModes.Active ? PauseModes.Paused : PauseModes.Active;
  }
  getPauseMode(): PauseModes {
    return this.appFlags.pauseMode;
  }

  getHelperByPhone(phone: string): Helper | null {
    const ret = this.helpers.filter((h: Helper) => h.user.phone == phone);
    return ret.length == 1 ? ret[0] : null;
  }

  register() {
    this.sock.send("register", this.user);
  }

  registerToastCallback(showUserNotification) {
    this.callbacks = { ...this.callbacks, showUserNotification: showUserNotification };
  }

  startPairingProcess() {
    this.removeHelperByPhone(Constants.unknownUserForPairing.phone);
    this.addHelper(Constants.unknownUserForPairing.name, Constants.unknownUserForPairing.phone, OperatingModes.Normal, HelperStates.Pending);
  }

  handleNewHelperPairingRequest(counters: Array<number>, data: Array<Uint8Array>) {
    const peer = this.getHelperByPhone(Constants.unknownUserForPairing.phone);

    if (peer) {
      const pairingData = peer.handlePairingRequest(counters, data);
      if (pairingData) {
        // When a peer is trying to pair in recovery mode, we move the lockbox share from the old data structure to the new one and delete the old one
        const oldPeerWithThisPhone = this.getHelperByPhone(pairingData.phone);
        if (pairingData.operatingMode == OperatingModes.Recovery) {
          if (oldPeerWithThisPhone) {
            peer.setLockboxShare(oldPeerWithThisPhone.lockboxShare);
            this.removeHelperByPhone(pairingData.phone);
          } else {
            global.log.recovery(`User ${pairingData.name} is trying to recover, but I don't have data about them`);
            this.callbacks.showUserNotification("Recovery attempt failed", `Previously unpaired User ${pairingData.name} is trying to recover`, true);
            return;
          }
        }

        peer.setUser(new User(pairingData.name, pairingData.phone));
        peer.setOperatingMode(pairingData.operatingMode);

        const packet = peer.pairingSession.createPairingResponse(this.user, this.appFlags.operatingMode, pairingData);
        this.sock.send("message", { type: MessageTypes.PairingResponse, fromPhone: this.user.phone, toPhone: pairingData.phone, data: packet });
      }
    } // Silently ignore if we can't find a user - maybe the scanner will eventually send correct data to us in the next scan
  }

  handleHelperPairingResponse(message: Message) {
    global.log.pairing(`pairing response received`);

    const peer = this.getHelperByPhone(Constants.unknownUserForPairing.phone);
    const peerHandshakeResponse = peer?.pairingSession.handlePairingResponse(message.data);
    global.log.pairing(`pairing response decoded: `, peerHandshakeResponse);
    if (peer && peerHandshakeResponse) {
      this.handleHelperPairingResponseBody(peer, peerHandshakeResponse);
    }
  }

  handleHelperPairingResponseBody(peer: Helper, peerHandshakeResponse: PairingHandshakePacketData) {
    if (peer && peerHandshakeResponse) {
      global.log.pairing(`Received PairingResponse from ${peerHandshakeResponse.name}`);
      // TBD: Check if the counters and nonces match against what was used in the QR code

      // When a peer is trying to pair in recovery mode, we move the lockbox share from the old data structure to the new one and delete the old one
      const oldPeerWithThisPhone = this.getHelperByPhone(peerHandshakeResponse.phone);
      if (peerHandshakeResponse.operatingMode == OperatingModes.Recovery) {
        if (oldPeerWithThisPhone) {
          peer.setLockboxShare(oldPeerWithThisPhone.lockboxShare);
          this.removeHelperByPhone(peerHandshakeResponse.phone);
        } else {
          global.log.recovery(`User ${peerHandshakeResponse.name} is trying to recover, but I don't have data about them`);
          this.callbacks.showUserNotification("Recovery attempt failed", `Previously unpaired User ${peerHandshakeResponse.name} is trying to recover`, true);
          return;
        }
      }

      peer.setUser(new User(peerHandshakeResponse.name, peerHandshakeResponse.phone));
      peer.setOperatingMode(peerHandshakeResponse.operatingMode);
      global.log.pairing(`setting helper state to Paired`);
      peer.setHelperState(HelperStates.Paired);

      // Inform the front-end, so it can close the pairing widget
      if (peer.callbacks.pairingHandshakeResponseMatched) {
        peer.callbacks.pairingHandshakeResponseMatched();
      }

      // Generate and send ack to this peer
      const ackPacket = peer.pairingSession.createPairingAck();
      this.sock.send("message", { type: MessageTypes.PairingAck, fromPhone: this.user.phone, toPhone: peer.user.phone, data: ackPacket });
      global.log.pairing(`ack sent`);

      this.pairingSuccessful(peer);
    }
  }

  showUserNotification(title: string, description: string, isPersistent: Boolean) {
    if (this.callbacks.showUserNotification) {
      this.callbacks.showUserNotification(title, description);
    }
    if (isPersistent) {
      this.notifications.push({ ts: new Date().getTime(), title: title, description: description });
    }
  }

  pairingSuccessful(peer: Helper) {
    peer.inSyncFlag = true;
    peer.lastSyncTime = Math.ceil(new Date().getTime() / 1000);
    if (this.appFlags.operatingMode == OperatingModes.Recovery) {
      this.showUserNotification(`${peer.user.name} added as a helper - Recovery in progress`, `Please continue pairing with half of your original helpers`, true);
      this.lockboxShares.sendLockboxShareRetrievalRequest(this.sock, this.user, peer);
    } else {
      const goodHelpers = this.helpers.filter((h: Helper) => h.state == HelperStates.Paired && h.inSyncFlag == true);
      if (goodHelpers.length >= Constants.minNumOfHelpers) {
        this.showUserNotification(`${peer.user.name} added as a helper`, `Redistributing Vault`, true);
        this.distributeLockbox();
      } else {
        this.showUserNotification(`${peer.user.name} added as a helper - Vault is not protected!`, `You have less than ${Constants.minNumOfHelpers} active paired helpers`, true);
      }
    }
  }

  addAccount(accountName: string, accountId: string, network: string, key: IKey) {
    const account: Account = new Account(accountName, accountId, network, key);
    this.vault.addElement(account);
    const goodHelpers = this.helpers.filter((h: Helper) => h.state == HelperStates.Paired && h.inSyncFlag == true);
    if (goodHelpers.length >= Constants.minNumOfHelpers) {
      this.showUserNotification(`Account (${accountName}) added`, `Redistributing Vault`, true);
      this.distributeLockbox();
    } else {
      this.showUserNotification(`Account (${accountName}) added`, `Vault protection requires minimum ${Constants.minNumOfHelpers} active paired helpers`, true);
    }
    this.callbacks.updateZuestandState();
  }

  removeAccount(id: string) {
    this.vault.removeElement(id);

    const goodHelpers = this.helpers.filter((h: Helper) => h.state == HelperStates.Paired && h.inSyncFlag == true);
    if (goodHelpers.length >= Constants.minNumOfHelpers) {
      this.showUserNotification(`Account deleted`, `Redistributing Vault`, true);
      this.distributeLockbox();
    } else {
      this.showUserNotification(`Account deleted`, `Vault protection requires minimum ${Constants.minNumOfHelpers} active paired helpers`, true);
    }
    this.callbacks.updateZuestandState();
  }
  addHelper(name: string, phone: string, helperMode: OperatingModes, helperState: HelperStates.Pending) {
    const helper: Helper = new Helper(this.user, this.appFlags.operatingMode, name, phone, helperMode, helperState, this.callbacks);
    this.helpers.push(helper);
  }

  deleteHelperUserCommand(phone: string) {
    const removedHelper = this.getHelperByPhone(phone);
    if (!removedHelper) {
      return;
    }
    const removedHelperName = removedHelper.user.name;

    this.removeHelperByPhone(phone);
    const goodHelpersAfter = this.helpers.filter((h: Helper) => h.state == HelperStates.Paired && h.inSyncFlag == true);
    if (goodHelpersAfter.length >= Constants.minNumOfHelpers) {
      this.showUserNotification(`${removedHelperName} removed as a helper`, `Redistributing Vault`, true);
    } else {
      this.showUserNotification(`${removedHelperName} removed as a helper`, `Unprotected vault - You have less than ${Constants.minNumOfHelpers} active paired helpers now`, true);
    }
  }

  deleteNotification(ts: number) {
    this.notifications = this.notifications.filter((n) => n.ts != ts);
  }
  deleteAllNotifications() {
    this.notifications = [];
  }

  removeHelperByPhone(phone: string) {
    this.helpers = this.helpers.filter((h: Helper) => h.user.phone != phone);

    this.distributeLockbox();
  }

  helperSyncAchieved(peer: Helper) {
    const goodHelpers = this.helpers.filter((h: Helper) => h.state == HelperStates.Paired && h.inSyncFlag == true);
    if (peer.lastSyncTime != 0) {
      if (goodHelpers.length < Constants.minNumOfHelpers) {
        this.showUserNotification(`Communication restored with ${peer.user.name}`, `Unprotected vault - You have less than ${Constants.minNumOfHelpers} active paired helpers now`, true);
      } else {
        this.showUserNotification(`Communication restored with ${peer.user.name}`, `Redistributing Vault`, true);
      }
    }
    this.helperSyncChanged(peer);
  }

  helperSyncLost(peer: Helper) {
    this.helperSyncChanged(peer);
    const goodHelpers = this.helpers.filter((h: Helper) => h.state == HelperStates.Paired && h.inSyncFlag == true);
    if (goodHelpers.length >= Constants.minNumOfHelpers) {
      this.showUserNotification(`Communication lost with ${peer.user.name}`, `Redistributing Vault`, true);
    } else {
      this.showUserNotification(`Communication lost with ${peer.user.name}`, `Vault no longer protected!`, true);
    }
  }

  helperSyncChanged(peer: Helper) {
    const goodHelpers = this.helpers.filter((h: Helper) => h.state == HelperStates.Paired && h.inSyncFlag == true);
    if (goodHelpers.length >= Constants.minNumOfHelpers) {
      this.distributeLockbox();
    }
  }

  distributeLockbox() {
    if (this.appFlags.operatingMode == OperatingModes.Normal) {
      this.lockboxShares.distributeLockboxShares(this.user, this.vault, this.helpers, this.sock);
    }
  }

  recoverySuccessful(helpersAndVault) {
    global.log.recovery(`We have sufficent number of helpers. Successful recovery!`);
    const [helpers, vault] = helpersAndVault;
    // Restore those helpers that did not participate in the recovery process, and the vault
    const currentHelpersPhones = this.helpers.map((h) => h.user.phone);
    const helpersUnpairedDuringRecovery = helpers.filter((h) => !currentHelpersPhones.includes(h.user.phone));
    helpersUnpairedDuringRecovery.forEach((recovered) => {
      global.log.recovery(`Recovering user: ${recovered.user.name}`);
      this.addHelper(Constants.unknownUserForRecovery.name, Constants.unknownUserForRecovery.phone, OperatingModes.Normal, HelperStates.Pending);
      const dummyHelper = this.getHelperByPhone(Constants.unknownUserForRecovery.phone);
      dummyHelper?.restoreAfterRecovery(recovered);
      global.log.recovery(`Recovering user session key : ${dummyHelper?.toString(false)}`);
    });
    this.vault = vault as IVault;
    this.appFlags.operatingMode = OperatingModes.Normal;
    helpers.forEach((peer) => {
      this.sock.send("message", { type: MessageTypes.LockboxShareInfoRequest, fromPhone: this.user.phone, toPhone: peer.user.phone, data: null });
    });
    this.showUserNotification(`Recovery Successful`, `Restored ${this.vault.elements.length} ${this.vault.elements.length == 1 ? "account" : "accounts"}, and ${this.helpers.length} helpers!`, true);
    this.distributeLockbox();
  }

  processSockMessage(message: Message) {
    if (message.type != MessageTypes.KeepAliveRequest && message.type != MessageTypes.KeepAliveResponse) {
      global.log.info(`in processSockMessage received message from: ${message.fromPhone} to ${message.toPhone} type: ${message.type} `);
    }
    if (message.type == MessageTypes.PairingResponse) {
      this.handleHelperPairingResponse(message);
    } else {
      const peer = this.getHelperByPhone(message.fromPhone);
      if (!peer) {
        global.log.info(`received message from unknown peer: ${message.fromPhone}`);
        return;
      }
      let decryptedData;
      if (message.data) {
        decryptedData = peer.pairingSession.decrypt(new Uint8Array(message.data));
        if (decryptedData.length == 0) {
          global.log.info(`could not decrypt data from peer: ${message.fromPhone}`);
          return;
        }
      }
      switch (message.type) {
        case MessageTypes.PairingAck:
          global.log.pairing(`Received PairingAck from ${peer.user.name}`);
          const goodAck = peer.pairingSession.handlePairingAck(decryptedData);
          if (goodAck) {
            peer.setHelperState(HelperStates.Paired);
            this.pairingSuccessful(peer);
          }
          break;
        case MessageTypes.KeepAliveRequest:
          if (this.appFlags.pauseMode == PauseModes.Active) {
            this.sock.send("message", { type: MessageTypes.KeepAliveResponse, fromPhone: this.user.phone, toPhone: peer.user.phone, data: null });
          }
          break;
        case MessageTypes.KeepAliveResponse:
          const newInSyncFlag: boolean = true;
          if (peer.inSyncFlag != newInSyncFlag) {
            peer.inSyncFlag = newInSyncFlag;
            this.helperSyncAchieved(peer);
          }
          peer.lastSyncTime = Math.ceil(new Date().getTime() / 1000);

          break;
        case MessageTypes.LockboxShareRetrievalRequest:
          if (peer.lockboxShare.length > 0) {
            const lockboxShareRetrievalResponseData = peer.createLockboxShareRetrievalResponseData();
            this.sock.send("message", { type: MessageTypes.LockboxShareRetrievalResponse, fromPhone: this.user.phone, toPhone: peer.user.phone, data: lockboxShareRetrievalResponseData });
          }
          break;
        case MessageTypes.LockboxShareRetrievalResponse:
          const response = this.lockboxShares.storeRetrievedLockboxShareAndAttemptRecovery(peer, decryptedData);
          if (response == null) {
            // Insufficient helpers are paired for a successful recovery. Better luck next time!
            global.log.recovery(`LockboxShareRetrievalResponse received. There are insufficent number of helpers`);
          } else {
            this.recoverySuccessful(response);
          }
          break;

        case MessageTypes.LockboxShareInfoRequest:
          this.distributeLockbox();
          break;
        case MessageTypes.LockboxShareInfoUpdate:
          this.lockboxShares.handleLockboxShareInfoUpdate(peer, decryptedData);
          break;
      }
    }
  }

  handlePeriodicTasks() {
    // Send keepalive to each helper and check if any helper has not responded for KeepAliveTimeoutPeriod
    const currTime = Math.floor(new Date().getTime() / 1000);
    for (const peer of this.helpers) {
      if (this.appFlags.pauseMode == PauseModes.Active && peer.user.name != Constants.unknownUserForPairing.name) {
        this.sock.send("message", { type: MessageTypes.KeepAliveRequest, fromPhone: this.user.phone, toPhone: peer.user.phone, data: null });
      }
      const newInSyncFlag: boolean = currTime - peer.lastSyncTime < Constants.KeepAliveTimeoutPeriod ? true : false;
      if (peer.inSyncFlag != newInSyncFlag) {
        peer.inSyncFlag = newInSyncFlag;
        this.helperSyncLost(peer);
      }
    }
  }

  appState(): AppStateInterface {
    return {
      user: this.user,
      appFlags: this.appFlags,
      vault: this.vault,
      helpers: this.helpers,
      notifications: this.notifications,
      qrCodesData: this.qrCodesData,
    };
  }
}
