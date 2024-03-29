var socket = io.connect();
var serverOptions = {};
var indexData = {};
var songData = {};
var texts = [];
var currentIdx = -1;
var currentSong = -1;
var obsScenes = [];
var sortableTitles = null;


$(function () {
    $("#preview").embed();

    $("#tab .item").tab();

    $('.menu .browse').popup({
        inline: true,
        hoverable: true,
        position: 'bottom left',
        delay: {
            show: 300,
            hide: 3000
        }
    });

    $('#loadTitle1').dropdown({
        direction: "downward",
        action: function (text, value) {
            $("#title1").val(text);
            $('#loadTitle1').dropdown("hide");
        }
    });

    $('#loadTitle2').dropdown({
        direction: "downward",
        action: function (text, value) {
            $("#title2").val(text);
            $('#loadTitle2').dropdown("hide");
        }
    });

    $('#loadSub1').dropdown({
        direction: "downward",
        action: function (text, value) {
            $("#sub1").val(text);
            $('#loadSub1').dropdown("hide");
        }
    });

    $('#loadSub2').dropdown({
        direction: "downward",
        action: function (text, value) {
            $("#sub2").val(text);
            $('#loadSub2').dropdown("hide");
        }
    });

    $('#file').dropdown({
        direction: "downward",
        action: function (text, value) {
            switch (value) {
                case "new":
                    socket.emit("newShow");
                    break;
                case "open":
                    openShow();
                    break;
                case "save":
                    saveShow();
                    break;
            }
            $('#file').dropdown("hide");
        }
    });

    $('#utils').dropdown({
        direction: "downward",
        action: function (text, value) {
            switch (value) {
                case "obs":
                    socket.emit("obs.connect");
                    break;
                case "qlc":
                    socket.emit("qlc.connect");
                    break;
            }
            $('#file').dropdown("hide");
        }
    });

    $(window).resize(function () {
        if (this.resizeTO)
            clearTimeout(this.resizeTO);

        this.resizeTO = setTimeout(function () {
            $(this).trigger('viewportResize');
        }, 250);
    });

    $(window).on('viewportResize', function () {
        $("#col1").css("height", ($(window).height() - (50 + $("#preview iframe").height() + $(".menu").height())) + "px")
        $("#col2").css("height", ($(window).height() - (50 + $(".menu").height())) + "px")
        $("#col3").css("height", ($(window).height() - (50 + $(".menu").height())) + "px")
    });

    $(window).trigger('viewportResize');

    $.getJSON("/ajax/backgrounds", (payload, err) => {        
        let output = "";
        let idx = 0;
        for(filename of payload.data) {
            output += `
            <div class="ui left aligned gray message inverted item" id="bg_${idx}" data-bg="${filename}">
                <div class="ui content noselect">           
                    <button class="ui small basic inverted icon button" onclick="setBackground('${filename}', this)"><i class="play icon"></i></button>${filename}
                </div>
            </div>`;
            idx+=1;
        }

        $("#backgrounds").html(output);
    });
});

socket.on("update", data => {
    serverOptions = data;
    renderUI();
});

socket.on("callback.setBackground", data => {
    serverOptions = data;
    renderUI();
});

socket.on("updateAll", data => {
    serverOptions = data;
    updateSongs();
    $("#showTitle").val(data.showData.name);
    renderUI();
});

socket.on("callback.loadSong", data => {
    updateSong(data);
    renderUI();
});

socket.on('obs.scenelist', data => {
    let output = "";
    obsScenes = data.scenes;
    serverOptions.obs.currentScene = data.currentScene;

    let idx = 0;
    for (var scene of data.scenes) {
        let action = "";
        let color = "disabled";
        if (scene.enabled) {
            action = `ondblClick="setScene('${scene.name}', this)"`;
            color = "";
        }
        output += `
        <div class="ui left aligned gray message inverted item" id="scene_${idx}">
            <div class="ui content noselect">           
                <button class="ui small basic inverted icon button" ondblclick="setScene('${scene.name}', this)"><i class="play icon"></i></button> ${scene.name}
            </div>
        </div>`;
        idx++;
    }
    $("#sceneList").html(output);

    renderUI();
});

socket.on('obs.update', data => {
    serverOptions = data;
    renderUI();
});

function renameShow() {
    socket.emit("renameShow", $("#showTitle").val());
}

function setBackground(file) {
    socket.emit("setBackground", file);
}

function blackout() {
    socket.emit("toggleBlackout");
}

function openShow() {
    $('.fileAction').text("Open");
    $("#dialogFilename").val("");
    $('#showContent').DataTable().destroy();
    $('#showContent').DataTable({
        paging: false,
        scrollCollapse: true,
        info: false,
        ajax: '/ajax/shows',
        columns: [
            { data: "file" }
        ],
        "initComplete": function () {
            var api = this.api();
            api.$('td').click(function () {
                $("#dialogFilename").val(this.innerHTML);
            });
        }
    });

    $('#showDialog').modal({
        blurring: true,
        onApprove: function () {
            socket.emit("loadShow", $("#dialogFilename").val());
        }
    }).modal('show');
}

function saveShow() {
    $('.fileAction').text("Save");
    $("#dialogFilename").val("");
    $('#showContent').DataTable().destroy();
    $('#showContent').DataTable({
        paging: false,
        scrollCollapse: true,
        info: false,
        ajax: '/ajax/shows',
        columns: [
            { data: "file" }
        ],
        "initComplete": function () {
            var api = this.api();
            api.$('td').click(function () {
                $("#dialogFilename").val(this.innerHTML);
            });
        }
    });
    $('#showDialog').modal({
        blurring: true,
        onApprove: function () {
            socket.emit("saveShow", $("#dialogFilename").val());
        }
    }).modal('show');
}

function importSongs() {
    $('#songContent').DataTable().destroy();
    $('#songContent').DataTable({
        paging: true,
        scrollCollapse: true,
        pageLength: 20,
        lengthChange: false,
        info: false,
        ajax: '/ajax/songs',
        columns: [
            { data: "title" },
            { data: "artist" },
            { data: "file" },
        ],
        "columnDefs": [
            {
                // The `data` parameter refers to the data for the cell (defined by the
                // `data` option, which defaults to the column being worked with, in
                // this case `data: 0`.
                "render": function (data, type, row) {
                    return `
                        <div class="ui button" onclick="editSong('${data}')">Edit</div>
                        <div class="ui green button" onclick="addSong('${data}')">Import</div>
                        `;
                },
                "targets": 2
            },
        ]
    });

    $('#songDialog').modal({
        blurring: true
    }).modal('show');
}



function updateSongs() {
    let output = "";
    let i = 0;
    for (var song of serverOptions.showData.songs) {
        output += `
        <div class="ui left aligned gray message inverted item" data-song="${song.file}" >
            <div class="right floated content noselect">
                <button class="ui small basic inverted icon button" onclick="removeSong(${i})"><i class="delete icon"></i></button>
            </div>
            <div class="ui content noselect">
                <div class="ui inverted basic icon button handle"><i class="move icon"></i></div>
                 <div class="ui inverted basic icon button" onclick="loadSong('${song.file}', ${i})"><i class="play icon"></i></div>
                 <i class="music icon"></i> ${song.title} (${song.artist})
            </div>
        </div>`;
        i++;
    }

    $('#allSongs').html(output);

    let allSongs = document.querySelector("#allSongs");
    new Sortable(allSongs, {
        handle: ".handle",
        group: 'songs',
        animation: 150,
        onEnd: function (evt) {
            socket.emit("moveSong", evt.oldIndex, evt.newIndex);
        }
    });

}

function setScene(name, elem) {
    $(elem).addClass("loading");
    socket.emit("obs.setScene", name);
}

function updateSong(input) {
    songData = input.data;
    currentSong = input.file;
    let output = "";
    output +=
        `
        <h3 style="margin-bottom: 0;">${songData.artist}</h3>
        <h1 style="margin-top:0;">${songData.title}</h1>        
    `;
    if (serverOptions.qlc.enabled) {
        output += `     
        <hr class="ui separator" />
        <span>Quick Lights: </span>

        <div class="ui buttons">
            <div id="selectScene" class="ui gray dropdown icon button">
                <div class="text">Click to select</div>
                    <div class="menu">                                       
                    </div>               
                </div>             
            <div id="selectLightAction" class="ui floating gray dropdown icon button">
                <i class="dropdown icon"></i>
                <div class="menu">            
                    <div class="item" data-value="clear"><i class="remove icon"></i>Clear</div>                    
                </div>
            </div>
        </div>   
        <div class="ui green button" onclick="cueScene();">Cue</div>
                      
        <hr class="ui separator" />
        `;
    }
    texts = [];
    currentIdx = -1;
    let idx = 0;
    let songPart = 0;
    for (var data of songData.songData) {
        output += `<h3>${data.title}</h3>`;
        songSection = 0;
        let temp = "";
        for (var line of data.text.split("\n")) {
            temp += line + "<br>";
            if (songSection >= 1) {
                output += `
                    <div id="text_${idx}" class="ui inverted gray message item" onclick="sendText(${idx}, ${songPart})">            
                        <div class="content noselect">
                                ${temp}
                        </div>
                    </div>
                `;
                texts.push(temp);
                temp = "";
                idx++;
                songSection = -1;
            }
            songSection += 1;
        }
        if (temp != "") {
            output += `
            <div id="text_${idx}" class="ui inverted gray message item" onclick="sendText(${idx}, ${songPart})">            
                <div class="content noselect">
                        ${temp}
                </div>
            </div>
           
        `;
            idx++;
            texts.push(temp);
        }
        songPart += 1;
    }


    $('#song').html(output);
    if (serverOptions.qlc.enabled) {
        let qlcValues = [];

        for (let scene of serverOptions.qlc.scenes) {
            qlcValues.push({ name: scene.name, value: scene.name });
        }

        $('#selectScene').dropdown({
            direction: "downward",
            values: qlcValues,
            action: function (text, value) {
                $('#selectScene').dropdown("set selected", value);
                let val = $('#selectScene').dropdown("get value");
                socket.emit("qlc.saveSongScene", val);
                $('#selectScene').dropdown("hide");
            },
        });

        if (serverOptions.showData.lights[input.file]) {
            $('#selectScene').dropdown("set selected", serverOptions.showData.lights[input.file]);
        }

        $('#selectLightAction').dropdown({
            direction: "downward",
            action: function (text, value) {
                switch (value) {
                    case "clear":
                        socket.emit("qlc.saveSongScene", null);
                        $('#selectScene').dropdown("clear");
                        break;
                }
                $('#selectLightAction').dropdown("hide");
            }
        });
    }

}

function cueScene() {
    let val = $('#selectScene').dropdown("get value");
    socket.emit("qlc.cueScene", val);
}

function loadSong(songid, index) {
    socket.emit("loadSong", songid);
    currentSong = songid;
}

function addSong(file) {
    socket.emit("addSong", file);
}

function removeSong(songid) {
    if (confirm("are you sure ?")) {
        socket.emit("removeSong", songid);
    }
}

function removeTitle(id) {
    if (confirm("are you sure ?")) {
        socket.emit("removeTitle", id);
    }
}

function sendText(idx, songSection) {
    $("#song .item").each(function () {
        $(this).removeClass("active");
    });

    $("#text_" + idx).addClass("active");
    if (idx < 0) {
        currentIdx = -1;
        socket.emit("setText", {text:"", slideText:""});
    }
    if (idx >= texts.length) {
        currentIdx = texts.length;
        socket.emit("setText", {text:"", slideText:""});
    }
    if (currentIdx == idx) {
        clearText();
        currentIdx = -1;
        return;
    }
    if (texts[idx]) {
        currentIdx = idx;
        socket.emit("setText", { text: texts[idx], slideText: songData.songData[songSection].text} );
    }
}

function nextText() {
    sendText(currentIdx + 1);
}

function prevText() {
    sendText(currentIdx - 1);
}

function clearText() {
    socket.emit("setText", {text: "", slideText: ""});
    $("#song .item").each(function () {
        $(this).removeClass("active");
    });
}

function editSong(filename) {
    window.open("/admin/editsong?uuid=" + filename, '_blank', 'location=no,height=720,width=600,status=no');
}


function createNewSong() {
    editSong("");
}


function renderUI() {
    if (serverOptions.showTitle === true) {
        $('#toggleTitlesButton').removeClass("inverted");
    } else {
        $('#toggleTitlesButton').addClass("inverted");
    }

    let errCount = 0;
    if (serverOptions.obs.enabled) {
        if (serverOptions.obs.connected) {
            $("#obsStatus").html(`<i class="ui icon check circle"></i>`);
        } else {
            errCount += 1;
            $("#obsStatus").html(`<i class="ui icon circle outline"></i>`);
        }
    }
    if (serverOptions.qlc.enabled) {
        if (serverOptions.qlc.connected) {
            $("#qlcStatus").html(`<i class="ui icon check circle"></i>`);
        } else {
            errCount += 1;
            $("#qlcStatus").html(`<i class="ui icon circle outline"></i>`);
        }
    }
    if (errCount > 0) {
        $("#connectStatuses").html(`<span class="ui red circular label">${errCount}</span>`);
    } else {
        $("#connectStatuses").html(``);
    }

    $("#sceneList .item").each(function (idx, elem) {
        $(elem).find("button").removeClass("green loading");
        $(elem).removeClass("green").addClass("gray");
        if (obsScenes[idx].name == serverOptions.obs.currentScene) {
            $(elem).removeClass("gray").addClass("green");
        }
        idx++;
    });

    if (currentSong != "") {
        $("#allSongs .item").each(function (idx, elem) {
            $(elem).removeClass("green").addClass("gray");
            if (elem.dataset.song == currentSong) {
                $(elem).removeClass('gray').addClass("green");
            }
        });
    }

    let titles = "";
    i = 0;
    for (var title of serverOptions.showData.titles) {
        titles += `
        <div class="ui left aligned gray message inverted item handle" data-idx="${title[0]}" >
        <div class="right floated content noselect">
            <button class="ui small basic inverted icon button" onclick="removeTitle(${i})"><i class="delete icon"></i></button>
        </div>
        <div class="ui content noselect" onclick="showTitle(${i})">
             <div class="ui inverted basic icon button" onclick="showTitle(${i})"><i class="play icon"></i></div>
             ${title[0]}
        </div>
        </div>`;
        i++;
    }

    $('#myTitles').html(titles);

    $("#myTitles .item").each(function (idx, elem) {
        $(elem).removeClass("active")
        if (serverOptions.titles.index != undefined && elem.dataset.idx === serverOptions.titles.title1) {
            $(elem).addClass("active");
        }
    });
    if (sortableTitles) sortableTitles.destroy();

    sortableTitles = new Sortable(document.querySelector("#myTitles"), {
        handle: ".handle",
        group: 'titles',
        animation: 150,
        onEnd: function (evt) {
            socket.emit("moveTitle", evt.oldIndex, evt.newIndex);
        }
    });

    let qlc = "";
    i = 0;
    for (var scene of serverOptions.qlc.scenes) {
        qlc += `
        <div class="ui left aligned gray message inverted item handle" data-idx="${scene.name}" >
        <div class="ui content noselect" onclick="switchScene(${scene.id})">
             <div class="ui inverted basic icon button"><i class="play icon"></i></div>
             ${scene.name}
        </div>
        </div>`;
        i++;
    }
    $('#lights').html(qlc);

    $("#lights .item").each(function (idx, elem) {
        $(elem).removeClass("active")
        if (serverOptions.qlc.statuses[idx] == "Running") {
            $(elem).addClass("active");
        }
    });

    $("#backgrounds .item").each(function (idx, elem) {
        $(elem).removeClass("active")
        if (elem.dataset.bg == serverOptions.background) {
            $(elem).addClass("active");
        }
    });    
}

function changeSource(url) {
    let id = $('#preview').embed("get id");
    $('#preview').embed('change', null, id, url);
    $("#button-projector").removeClass("green");
    $("#button-stream").removeClass("green");
    switch (url) {
        case "/":
            $("#button-projector").addClass("green"); 
            break;
        case "/video":
            $("#button-stream").addClass("green"); 
            break;
    }
}

function switchScene(index) {
    socket.emit("qlc.switchScene", index);
}

function createTitle() {
    if ($("#newTitle").val() != "") {
        socket.emit("createTitle", $("#newTitle").val());
        $("#newTitle").val("");
    }
}

function toggleTitles() {
    if (serverOptions.showTitle === true) {
        hideTitles();
    } else {
        showTitles();
    }
}

function selectShowFile(elem) {
    var file = $(elem).find(".header").text();
    $('#dialogFilename').val(file);
}

function showTitles() {
    let data = {
        title1: $("#title1").val(),
        sub1: $("#sub1").val(),
        title2: $("#title2").val(),
        sub2: $("#sub2").val()
    };
    socket.emit("showTitles", data);
}

function showTitle(index) {
    if (serverOptions.showTitle === true) {
        hideTitles();
    } else {
        let titles = serverOptions.showData.titles;
        if (titles[index]) {
            let data = {
                index: index,
                title1: titles[index][0],
                sub1: titles[index][1]
            };
            socket.emit("showTitles", data);
        }
    }
}

function hideTitles() {
    socket.emit("hideTitles", null);
}

function update(event) {
    event.preventDefault;
    return false;
}