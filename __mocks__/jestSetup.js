import { AppLogic } from "../logic/AppLogic";

const drecs = {};

const helpersList = {
  "Grand Ma": { name: "Grand Ma", phone: "12345" },
  Alice: { name: "Alice", phone: "11" },
  Bob: { name: "Bob", phone: "22" },
  Carol: { name: "Carol", phone: "33" },
  Dave: { name: "Dave", phone: "44" },
};

jest.mock("socket.io-client", () => {
  const mSocket = {
    emit: (type, data) => {
      // console.log(`Mock socket emit type: ${type} from ${data?.fromPhone} to ${data?.toPhone}`);
      const recipeients = Object.values(helpersList).filter((h) => h.phone == data?.toPhone);
      if (recipeients.length == 1) {
        const to = recipeients[0];
        drecs[to.name].processSockMessage(data);
      }
    },
    register: (msg) => {},
    on: (msg) => {},
    io: {
      on: (msg) => {},
    },
  };
  return jest.fn(() => mSocket);
});

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

  clear: () => {
    return new Promise((resolve) => {
      resolve(null);
    });
  },
}));

// Log mocking
log = {};
["trace", "info", "keepAlive", "pairing", "recovery", "lockbox", "error"].forEach((level) => {
  log[level] = jest.fn();
});
global.log = log;

const createContextForOneUser = async (name, phone) => {
  const callbacks = {
    showUserNotification: jest.fn(),
    updateZuestandState: jest.fn(),
    pairingHandshakeResponseMatched: jest.fn(),
    confirmPairingWithRecoveringPeer: jest.fn().mockImplementation((pairingResponsePacketForRecoveringPeer) => {
      drecs[name].pairingResponsePacketForRecoveringPeer = pairingResponsePacketForRecoveringPeer;
    }),
  };
  drecs[name] = await new AppLogic(callbacks);
  drecs[name].callbacks = callbacks;
  drecs[name].setUser(name, phone);
};

const createHelpersContext = async () => {
  Object.values(helpersList).forEach(async (h) => {
    await createContextForOneUser(h.name, h.phone);
  });
  console.log(`created all drecs as: ${Object.keys(drecs)}`);
};

(async () => {
  await createHelpersContext();
})();

export { drecs, helpersList, createContextForOneUser };
