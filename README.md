# Decentralized Recovery (DeRec)

## Prerequisites
You should have the following installed on your computer:
- node version 16.16.0 (Note: you can't use version 17+ since it has incompatible changes)
- yarn version 1.22.xx or above
- nvm (node version manager, if you want to use different versions of nodeJS on your computer)


## Setup
1. Open two Terminal tabs.
2. In the first tab, we will start the SocketIoRelay:
	a. Run this command: `nvm use 16.16.0`
	b. Navigate to the SocketIoRelay directory inside of the project: `cd ~/path/to/derec/SocketIoRelay`
	c. Run `yarn install` in the SocketIoRelay directory
	d. After successful install, run `yarn start` 
3. In the second tab, we will start the Expo application:
	a. Run this command: `nvm use 16.16.0`
	b. Navigate to the root directory of the project: `cd ~/path/to/derec/`
	c. Run `yarn install` in the root directory of the project
	d. After successful install, run `yarn start`
4. Copy the `sample.env.ts` file to `env.ts`, and edit it so that the `SERVER_LINK` variable points to where you are running the SocketIoRelay service. Do not leave the `SERVER_LINK` variable as localhost because the phones will not be able to connect to the server unless they have a full IP address (e.g. 192.168.0.100). The phones must be connected to the same WiFi network for the application to work.

## Starting the application
### Android Instructions
1. Download the Expo Go app.
2. Open the Expo Go app and scan the QR code on the second Terminal window. This will start up the DeRec app on your phone.
### iPhone Instructions
1. Download the Expo Go app.
2. Open the Camera app and scan the QR code on the second Terminal window. This will start the DeRec app on your phone using the Expo Go app.
### Web Instructions
1. On the second Terminal window, type `w`. This will start the DeRec app on your browser.
2. To run multiple instances of the DeRec app on web, it is recommended to open multiple windows and not tabs, and copy-paste the URL from the browser window that was opened when you typed `w` in the above step. If you open multiple tabs on the same browser, most browsers will disable the periodic timers needed for keepalive messages.