
const fs = require("fs");
const config = require('../config.json');

class websocket {


    constructor(io, obs) {
        this.serverOptions = {
            obs: {
                currentScene: "",
            },
            currentText: "",
            showTitle: false,
            titles: {
                title1: "",
                sub1: "",
                title2: "",
                sub2: ""
            }
        }

        this.obs = obs || {};
        this.io = io;
        let self = this;


        obs.on('SwitchScenes', data => {
            self.serverOptions.obs.currentScene = data.sceneName;
            io.emit("obs.update", self.serverOptions);
        });

        io.on('connection',
            /** @var {SocketIO.client} client */
            client => {
                client.emit("update", self.serverOptions)
                client.emit("callback.dataUpdate", self.getIndexFile());
                if (config.obs.enabled) {
                    self.getObsStatus(client);
                }
                
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

                client.on("obs.setScene", async (scene) => {
                    try {
                        let data = await obs.send("SetCurrentScene", { 'scene-name': scene });
                    } catch (e) {
                        io.emit("obs.update", self.serverOptions);
                    }
                });

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
    async getObsStatus(socket) {
        try {
            let data = await this.obs.send("GetSceneList");
            let outScenes = [];

            for (let scene of data.scenes) {
                let obj = {
                    name: scene.name,
                    enabled: false
                }
                if (config.obs.scenes.indexOf(scene.name) != -1) {
                    obj.enabled = true;
                }
                outScenes.push(obj);
            }

            this.serverOptions.obs.currentScene = data.currentScene;
            socket.emit("obs.scenelist", { currentScene: data.currentScene, scenes: outScenes });
        } catch (e) {
            console.log(e);
            socket.emit("obs.scenelist", { currentScene: "", scenes: [] });
        }
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
