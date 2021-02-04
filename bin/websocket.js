
const fs = require("fs");
const config = require('../config.json');

class websocket {

    constructor(io, obs) {
        this.serverOptions = {
            obs: {
                currentScene: "",
            },
            currentText: "",

            currentShow: "",
            showData: {
                name: "",
                titles: [],
                songs: []
            },

            showTitle: false,
            titles: {
                index: -1,
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
                client.emit("updateAll", self.serverOptions);

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
                    self.serverOptions.titles = {};
                    io.emit("update", self.serverOptions);
                });

                client.on("setText", data => {
                    self.serverOptions.showTitle = false;
                    self.serverOptions.currentText = data.replace("\n", "<br/>");
                    io.emit("update", self.serverOptions);
                })

                client.on("obs.setScene", async (scene) => {
                    try {
                        await obs.send("SetCurrentScene", { 'scene-name': scene });
                    } catch (e) {
                        io.emit("obs.update", self.serverOptions);
                    }
                });

                client.on("getData", () => {
                    io.emit("callback.dataUpdate", self.getIndexFile());
                });


                client.on("moveSong", (oldIndex, newIndex) => {
                    let song = self.serverOptions.showData.songs.splice(oldIndex, 1);
                    self.serverOptions.showData.songs.splice(newIndex, 0, song[0]);
                    io.emit("updateAll", self.serverOptions);
                });

                client.on("moveTitle", (oldIndex, newIndex) => {
                    let song = self.serverOptions.showData.titles.splice(oldIndex, 1);
                    self.serverOptions.showData.titles.splice(newIndex, 0, song[0]);
                    io.emit("update", self.serverOptions);
                });

                client.on("renameShow", (newName) => {
                    self.serverOptions.showData.name = newName;
                    io.emit("updateAll", self.serverOptions);
                });

                client.on("addSong", (file) => {
                    try {
                        let songMeta = JSON.parse(fs.readFileSync("./data/songs/" + file).toString());
                        self.serverOptions.showData.songs.push({ artist: songMeta.artist, title: songMeta.title, file: file });
                        io.emit("updateAll", self.serverOptions);
                    } catch (e) {
                        console.log(e);
                    }
                });

                client.on("removeSong", (i) => {
                    try {
                        self.serverOptions.showData.songs.splice(i, 1);
                        io.emit("updateAll", self.serverOptions);
                    } catch (e) {
                        console.log(e);
                    } 0
                });

                client.on("removeTitle", (i) => {
                    try {
                        self.serverOptions.showData.titles.splice(i, 1);
                        io.emit("update", self.serverOptions);
                    } catch (e) {
                        console.log(e);
                    }
                });

                client.on("createTitle", (newTitle) => {
                    self.serverOptions.showData.titles.push([newTitle, ""]);
                    io.emit("update", self.serverOptions);
                })

                client.on("newShow", () => {
                    self.serverOptions.currentShow = "";
                    self.serverOptions.showData = {
                        name: "",
                        titles: [],
                        songs: []
                    }
                    client.emit("updateAll", self.serverOptions);
                });

                client.on("loadShow", (file) => {
                    try {
                        if (fs.existsSync("./data/shows/" + file)) {
                            self.serverOptions.showData = JSON.parse(fs.readFileSync("./data/shows/" + file).toString());
                            self.serverOptions.currentShow = file;
                            client.emit("updateAll", self.serverOptions);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                });

                client.on("saveShow", (file) => {
                    try {
                        file = file.replace(".json", "") + ".json";
                        let fileData = JSON.stringify(self.serverOptions.showData);
                        fs.writeFileSync("./data/shows/" + file, fileData);
                        client.emit("updateAll", self.serverOptions);
                    } catch (error) {
                        console.log(error);
                    }
                });


                client.on("loadSong", file => {
                    client.emit("callback.loadSong", self.getSong(file));
                });
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
                if (config.obs.scenes.includes("*") || config.obs.scenes.indexOf(scene.name) != -1) {
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
    }

    getSong(filename) {
        return { file: filename, data: JSON.parse(fs.readFileSync("./data/songs/" + filename).toString()) };
    }
}

module.exports = websocket;
