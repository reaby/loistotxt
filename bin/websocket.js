
const fs = require("fs");

class websocket {


    constructor(io) {
        this.serverOptions = {
            currentText: "",
            showTitle: false,
            titles: {
                title1: "",
                sub1: "",
                title2: "",
                sub2: ""
            }
        }
        let self = this;

        io.on('connection',
            /** @var {SocketIO.client} client */
            client => {
                client.emit("update", self.serverOptions)
                client.emit("callback.dataUpdate", self.getIndexFile());

                client.on("showTitles", data => {
                    self.serverOptions.showTitle = true;
                    self.serverOptions.currentText = "";
                    self.serverOptions.titles = data;
                    io.emit("update", self.serverOptions);
                });

                client.on("hideTitles", data => {
                    self.serverOptions.showTitle = false;
                    self.serverOptions.currentText = "";
                    io.emit("update", self.serverOptions);
                });

                client.on("setText", data => {
                    self.serverOptions.showTitle = false;
                    self.serverOptions.currentText = data.replace("\n", "<br/>");
                    io.emit("update", self.serverOptions);
                })

                client.on("getData", () => {
                    io.emit("callback.dataUpdate", self.getIndexFile());
                })

                client.on("loadSong", songid => {
                    let indexData = self.getIndexFile();
                    for (let song of indexData.songs) {
                        if (song.id == songid) {
                            client.emit("callback.loadSong", {
                                name: song.title,
                                data: self.getSongFile(song.file)
                            });
                        }
                    }
                })
            });
    }

    getIndexFile() {

        let files = fs.readdirSync("./data/songs");
        let data = {
            songs: []
        }

        for (let file of files) {
            let song = {
                "id": file.replace(".json", ""),
                "title": file.replace(".json", "").replace(/_/g, " "),
                "description": "",
                "file": file
            };
            data.songs.push(song);
        }
        return data;

        return JSON.parse(fs.readFileSync("./data/index.json").toString());
    }

    getSongFile(filename) {
        return JSON.parse(fs.readFileSync("./data/songs/" + filename).toString());
    }


}


module.exports = websocket;
