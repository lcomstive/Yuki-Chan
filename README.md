# Yuki Chan Bot
## Another Discord bot :man_shrugging:

### Installation
Install all required NodeJS packages with `npm i` and wait for installation to finish.
Run `node .` so the config files are created.

Go to the Discord [developer portal](https://discordapp.com/developers/applications/) and create a new application.
Name it whatever you'd like and copy the `Client ID` to the `config/yuki-chan.json` `clientID`.

Switch to the `Bot` tab on Discord's site and press the `Add Bot` button and confirm
when the prompt appears.
From here you can set an icon and name (*if you want the bot name to be different
to the application name*), then proceed to the `Token` area and copy it to `config/yuki-chan.json` in the `discordToken` property.

While in this page, also turn on `Message Content Intent`

It should now look like

```
{
	"discordToken": "CLIENT_TOKEN",
	"clientID": "CLIENT_ID"
}
```

Restart the node application for a now functioning bot!

### License
This project is developed under the [MIT License](./LICENSE)
