
const fs = require("fs");
const config = require('../config.json');

class websocket {

    constructor(io, obs, qlc) {
        this.serverOptions = {
            qlc: {
                enabled: false,
                scenes: [],
                statuses: {},
            },
            obs: {
                currentScene: "",
            },
            currentText: "",
            currentShow: "",
            currentSong: "",
            showData: {
                name: "",
                titles: [],
                songs: [],
                lights: {},
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
        this.qlc = qlc || {};
        this.obs = obs || {};
        this.io = io;
        let self = this;

        if (config.qlc.enabled) {
            this.serverOptions.qlc.enabled = true;
            qlc.on("connect", (status) => {
                if (status) {
                    this.getQlcStatus();
                } else {
                    this.serverOptions.qlc.scenes = [];
                    this.serverOptions.qlc.statuses = {};
                }
            });
        }

        obs.on('SwitchScenes', data => {
            self.serverOptions.obs.currentScene = data.sceneName;
            io.emit("obs.update", self.serverOptions);
        });

        io.on('connection',
            /** @var {SocketIO.client} client */
            client => {
                io.emit("updateAll", self.serverOptions);
                if (config.obs.enabled) {
                    self.getObsStatus(client);
                }

                if (self.serverOptions.currentSong != "") {
                    io.emit("callback.loadSong", self.getSong(self.serverOptions.currentSong));
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
                        let file = self.serverOptions.showData.songs[i].file;
                        delete self.serverOptions.showData.lights[file];
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

                client.on("qlc.saveSongScene", (value) => {
                    let song = self.serverOptions.currentSong;
                    self.serverOptions.showData.lights[song] = value;
                });

                client.on("qlc.cueScene", async (value) => {
                    let index = -1;
                    for (let scene of self.serverOptions.qlc.scenes) {
                        if (scene.name == value) {
                            index = scene.id;
                        }
                    }
                    if (index !== -1) {
                        await self.setQlcScene(index);
                        setTimeout(async () => {
                            await self.getQlcStatus();
                            io.emit("obs.update", self.serverOptions);
                        }, 200)
                    }
                });


                client.on("qlc.switchScene", async (index) => {
                    self.setQlcScene(index);
                    setTimeout(async () => {
                        await self.getQlcStatus();
                        io.emit("obs.update", self.serverOptions);
                    }, 200)
                });

                client.on("qlc.syncScenes", async (index) => {
                    await self.getQlcStatus();
                    io.emit("obs.update", self.serverOptions);
                });

                client.on("qlc.clearScenes", async (index) => {
                    self.clearQlcScene(index);
                    setTimeout(async () => {
                        await self.getQlcStatus();
                        io.emit("obs.update", self.serverOptions);
                    }, 300)
                });

                client.on("newShow", () => {
                    self.serverOptions.currentShow = "";
                    self.serverOptions.showData = {
                        name: "",
                        titles: [],
                        songs: [],
                        lights: {}
                    }
                    io.emit("updateAll", self.serverOptions);
                });

                client.on("loadShow", (file) => {
                    try {
                        if (fs.existsSync("./data/shows/" + file)) {
                            self.serverOptions.showData = JSON.parse(fs.readFileSync("./data/shows/" + file).toString());
                            self.serverOptions.currentShow = file;
                            io.emit("updateAll", self.serverOptions);
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
                        io.emit("updateAll", self.serverOptions);
                    } catch (error) {
                        console.log(error);
                    }
                });

                client.on("loadSong", file => {
                    self.serverOptions.currentSong = file;
                    io.emit("callback.loadSong", self.getSong(file));
                });
            });
    }

    clearQlcScene(index) {
        for (let scene of this.serverOptions.qlc.scenes) {
            this.qlc.send("setFunctionStatus", scene.id, 0);
        }
    }

    setQlcScene(index) {
        for (let scene of this.serverOptions.qlc.scenes) {
            this.qlc.send("setFunctionStatus", scene.id, 0);
        }
        setTimeout(() => {
            this.qlc.send("setFunctionStatus", index, 1);
        }, 100);

    }

    async getQlcStatus() {
        let scenes = await this.qlc.query("getFunctionsList");
        this.serverOptions.qlc.scenes = scenes;
        for (let i in scenes) {
            this.serverOptions.qlc.statuses[i] = await this.qlc.query("getFunctionStatus", scenes[i].id);
        }
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
