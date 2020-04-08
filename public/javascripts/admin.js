
$(function () {
    $("#preview").embed();

    $('.menu .browse').popup({
        inline: true,
        hoverable: true,
        position: 'bottom left',
        delay: {
            show: 300,
            hide: 3000
        }
    });


    /*  $('#file').dropdown({
          direction: "downward",
          action: function (text, value) {
              switch (value) {
                  case "new":
  
                      break;
                  case "open":
                      console.log("open");
                      break;
                  case "save":
                      console.log("save");
                      break;
              }
          }
      });
  */
    $(window).resize(function () {
        if (this.resizeTO)
            clearTimeout(this.resizeTO);



        this.resizeTO = setTimeout(function () {
            $(this).trigger('viewportResize');
        }, 250);
    });

    $(window).on('viewportResize', function () {
        $("#col1").css("height", ($(window).height() - (40 + $("#preview iframe").height() + $(".menu").height() * 2)) + "px")
        $("#col2").css("height", ($(window).height() - (20 + $(".menu").height() * 2)) + "px")
        $("#col3").css("height", ($(window).height() - (20 + $(".menu").height() * 2)) + "px")
    });

    $(window).trigger('viewportResize');
});


var socket = io.connect();
var serverOptions = {};
var indexData = {};
var songName = "";
var songData = {};
var texts = [];
var currentIdx = -1;
var obsScenes = [];

socket.on("update", data => {
    serverOptions = data;
    renderUI();
});

socket.on("callback.dataUpdate", data => {
    indexData = data;
    updateSongs(data);
});

socket.on("callback.loadSong", data => {
    songName = data.name;
    songData = data.data;
    updateSong();
});

socket.on('obs.scenelist', data => {
    let output = "";
    obsScenes = data.scenes;
    serverOptions.obs.currentScene = data.currentScene;
    
    let idx = 0;
    for (var scene of data.scenes) {
        let action = "";
        let color = "disabled black";
        if (scene.enabled) {
            action = `ondblClick="setScene('${scene.name}', this)"`;
            color = "green";
        }

        output += `
        <button id="scene_${idx}" class="mini ui button ${color}" ${action} style="margin: 0 3px;">${scene.name}</button>
    `;
        idx++;
    }
    $("#sceneList").html(output);

    renderUI();
});

socket.on('obs.update', data => {
    serverOptions = data;    
    renderUI();
});


function updateSongs(data) {
    let output = "";
    for (var song of data.songs) {
        output += `
        <div class="ui green message item">
            <div class="right floated content">
                <button class="ui small basic inverted icon button" onclick="editSong('${song.id}')"><i class="edit icon"></i></button>
                <button class="ui small basic inverted icon button" onclick="loadSong('${song.id}')"><i class="play icon"></i></button>
            </div>
            <div class="content">
                <div> ${song.title}</div>
            </div>
        </div>`;
    }

    $('#allSongs').html(output);
}

function setScene(name, elem) {
    $(elem).addClass("loading");
    socket.emit("obs.setScene", name);
}

function updateSong() {
    let output = "<h1>" + songName + "</h1>";
    texts = [];
    currentIdx = -1;
    let idx = 0;
    for (var data of songData) {
        output += `<h5>${
            data.title
            }</h5>`;
        for (var line of data.texts) {
            texts.push(line.replace("\n", "<br>"));
            output += `
            <div id="text_${idx}" class="ui message item" onclick="sendText(${idx})">            
                <div class="content noselect">
                        ${line.replace("\n", '<br>')}
                </div>
            </div>`;
            idx++;
        }

    }

    $('#song').html(output);
}

function loadSong(songid) {
    socket.emit("loadSong", songid);
}

function sendText(idx) {
    $("#song .item").each(function () {
        $(this).removeClass("active");
    });

    $("#text_" + idx).addClass("active");
    if (idx < 0) {
        currentIdx = -1;
        socket.emit("setText", "");
    }
    if (idx >= texts.length) {
        currentIdx = texts.length;
        socket.emit("setText", "");
    }
    if (currentIdx == idx) {
        clearText();
        currentIdx = -1;
        return;
    }
    if (texts[idx]) {
        currentIdx = idx;
        socket.emit("setText", texts[idx]);
    }
}

function nextText() {
    sendText(currentIdx + 1);
}

function prevText() {
    sendText(currentIdx - 1);
}

function clearText() {
    socket.emit("setText", "");
    $("#song .item").each(function () {
        $(this).removeClass("active");
    });
}


function sendLine(text) {
    if (text) {
        socket.emit("setText", text);
        $("#song .item").each(function () {
            $(this).removeClass("active");
        });
    }
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
    var idx = 0;
    $("#sceneList button").each(function (idx, elem) {

        $(elem).addClass("inverted").removeClass("loading");
        if (obsScenes[idx].name == serverOptions.obs.currentScene) {
            console.log(obsScenes[idx].name);

            $(elem).removeClass("inverted");
        }
        idx++;
    });

}

function toggleTitles() {
    if (serverOptions.showTitle === true) {
        hideTitles();
    } else {
        showTitles();
    }
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

function hideTitles() {
    socket.emit("hideTitles", null);
}

function update(event) {
    event.preventDefault;

    return false;
}