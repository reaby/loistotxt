# LoistoTxt
Song lyrics and lower 3rd titles displayer to obs, vmix or any casting software that supports browser source. Additionally you can remote control whitelisted scenes at OBS (additional plugin required for this).

## Install
    
1. Install `nodejs` and `npm` to your platform (win/linux/mac)
2. optionally Install [obs-websocket](https://github.com/Palakis/obs-websocket/releases) plugin to your obs and set it up.
3. Get this repo to some folder at your computer

### Windows

1. double click `install_deps.bat`
2. double click `run.bat` and follow instructions
3. copy `config-default.json` to `config.json`
4. edit config.json to match your settings

### Linux (& Mac)

1. run `npm install` at the folder
2. start by writing `npm start` at console and follow instructions
3. copy `config-default.json` to `config.json`
4. edit config.json to match your settings

### config.json

structure of the file is quite obvious:

    {
        "obs": {
            "enabled": false,
            "scenes": [
                "Example1",
                "Example2"
            ],
            "websocket": {
                "address": "127.0.0.1:4444",
                "password": "admin"
            }
        }
    }

Scenes is a whitelist of scene names. You can use `"*"` to whitelist all scenes for changing.
Active scene is displayed with green color on the ui.

# Usage

After app starts, it says something like this:
    
    LoistoTxt starting...
    
    Admin interface now available:
    http://localhost:3000/admin

    OBS add new "browser source" and use this address:
    http://localhost:3000


Admin interface is without any passwords for now, since well, I don't need such at our production, and you should run this at a private network anyway...

And for OBS, like the console window says, add a new `browser source`, and paste the address there. You might need to click refresh source, if you restart the service, but it should auto connect anyway after you get initial connetion.