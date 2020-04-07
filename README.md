# LoistoTxt
Subtitles and Title generator for OBS

## Install
    
1. Install `nodejs` and `npm` to your platform (win/linux/mac)
2. Get this repo to some folder at your computer

### Windows

1. double click `install_deps.bat`
2. double click `run.bat` and follow instructions

### Linux (&& Mac)

1. run `npm install` at the folder
2. start service by writing `npm start` at console and follow instructions

# Usage

After app starts, it says something like this:
    
    LoistoTxt starting...
    
    Admin interface now available:
    http://localhost:3000/admin

    OBS add new "browser source" and use this address:
    http://localhost:3000


Admin interface is without any passwords for now, since well, I don't need such at our production, and you should run this at a private network anyway...

And for OBS, like the console window says, add a new `browser source`, and paste the address there. You might need to click refresh source, if you restart the service, but it should auto connect anyway after you get initial connetion.
