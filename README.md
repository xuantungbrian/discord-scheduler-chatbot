# CPEN441 - Scheduler Bot

### Group Members
| Name | 
| ---- |
| Muhan Li |
| Xuan Tung Luu |
| Nicholas Pang |
| Zoey Zhao |
| Nikoo Vali |

## Setup Instructions

### Prerequisites
We assume you have git, node.js, discord installed on you local machine

### Discord Developer Portal
1. Navigate to the [discord developer portal](https://discord.com/developers/), click get started and log in with your discord account.

2. Navigate to the **applications** tab in the left sidebar, create a new application with the button labeled **new application**

3. Customize your application (name, profile, etc) however you'd like

4. In the left sidebar, navigate to **Bot**, click the button **Reset Token**, and copy the new token to your clipboard. It is best to save this token on a local file, you will need this token later in the [local setup](#local-setup) section.

5. Ensure you are still selected to **Bot** in the left side bar, scroll down to the **Privileged Gateway Intents** section. Check the two switches labeled **Server Members Intent** and **Message Content Intent**, save these changes.

6. *(ASIDE)* For this prototype, we recommend testing it in a controlled environment. You can do this by creating your own discord server, and inviting a couple of your teammates/friends into the server. Ensure that you have admin permissions for this server.

7. Navigate to the *OAuth2** section in the left sidebar. Scroll to the **OAuth2 URL Generator**, check the box **bot**, which should be in the 3rd column from the left. Once that box is checked, scroll down to the **bot permissions** section, and check the box **Administrator**. Then, scroll down and copy the generated URL.

8. Paste this link into a new browser tab, this should redirect you to either the discord web app, or your discord desktop app. The link will open a prompt to add your bot to a server, add this to the server you created in step 6.

### Local Setup
1. Please start by cloning this repository to a local directory.

2. Navigate into your directory and create a file named `.env`, please ensure that this file is **ONLY** saved locally.

3. Copy the *token* saved earlier from [step 4 of the Discord Developer Portal](#discord-developer-portal) section. Your `.env` file should look like this:
```
TOKEN=<your_token_here>
```
4. Then, open a terminal and navigate to the root directory for this project. 

5. Execute the following commands
```zsh
npm i
```
```zsh
node index.js
```
6. Upon successful setup, you should see the following printed to your terminal
```zsh
Logged in as <bot name and id>
Bot is in the guild: <name of your server and id>
```
