var sortable = null;
var undoData = [];

$(() => {
    $.getJSON("/ajax/song/" + song, function (data) {
        let output = "";
        $("#title").val(data.title);
        $("#artist").val(data.artist);
        if (!Array.isArray(data.songData)) return;
        for (let elem of data.songData) {
            output += `<div class="ui gray inverted segment verse">                                                            
                                <div class="ui fluid labelled action input">                                               
                                    <label class="ui label handle"><i class="ui icon move"></i> Title</label>
                                    <input class="ui input" type="text" value="${elem.title}" />
                                    <button class="ui red icon button" onclick="removeElem($(this).parent());"><i class="ui trash icon"></i>Delete part</button>
                                </div>
                    
                                <div class="verseContent" style="margin-top: 1rem;">
                `;            
                output += `<div class="ui fluid action input" style="margin-top: 0.5rem;">
                            <div style="margin-left: 3rem;" class="ui icon button handle"><i class="ui icon move"></i></div>
                            <textarea cols="120" class="textarea" oninput="onEdit(this)" onchange="snap">${elem.text}</textarea>
                            <button style="margin-left: 0.25rem;" class="ui red icon button" onclick="removeElem(this);"><i class="ui trash icon"></i></button>
                            <button style="margin-left: 0.25rem;" class="ui red icon button" onclick="duplicateElem(this);"><i class="clone outline icon"></i></button>
                    </div>`;
            
            output += `</div>`;
            output += `<button style="margin-top: 1rem;" class="ui center aligned green icon button" onclick="addText(this);"><i class="ui icon add"></i> Add Text</button>`;
            output += `</div></div>`;

        }
        output += ``;
        $('#songeditor').html(output);
        setUndoPoint();
        update();
    });
});

function update() {
    let verses = document.querySelector("#songeditor");
    new Sortable(verses, {
        handle: ".handle",
        group: 'verses',
        animation: 150,
    });

    let songeditor = document.querySelectorAll(".verseContent");
    for (var i = 0; i < songeditor.length; i++) {
        new Sortable(songeditor[i], {
            handle: ".handle",
            group: 'lines',
            animation: 150
        });
    }

    let x = 0;
    for (let input of document.querySelectorAll("input")) {
        x += 1;
        input.tabIndex = x;
        for (let textarea of input.parentElement.parentElement.querySelectorAll("textarea")) {
            textarea.tabIndex = x;
            x += 1;
        }
    }

}

function removeElem(elem) {
    setUndoPoint();
    $(elem).parent().remove();
}


function addVerse() {
    setUndoPoint();
    output = `<div class="ui gray inverted segment verse">                   
                    <div class="ui fluid labelled action input">                  
                        <label class="ui label handle"><i class="ui icon move"></i> Title</label>
                        <input class="ui input" type="text" value="" autofocus="1" />
                        <button class="ui red icon button" onclick="removeElem($(this).parent());"><i class="ui trash icon"></i>Delete part</button>
                    </div>
                
                    <div class="verseContent" style="margin-top: 1rem;">
                    </div>
                    <button style="margin-top: 1rem;" class="ui center aligned green icon button" onclick="addText(this);"><i class="ui icon add"></i>Add Text</button>                 
                    </div>
                `;
    $("#songeditor").append(output);
    $("#songeditor input").last().focus();

    update();
}


function setUndoPoint() {
    let history = 10;
    if (undoData.length > history) {
        undoData = undoData.slice(0, history);
    }
    undoData.unshift($("#songeditor").clone());
}

function redo() {
    data = undoData.shift();
    if (undoData !== null) {
        $("#songeditor").html(data);
    }
}
function duplicateElem(elem) {
    setUndoPoint();
    $(elem).parent().parent().append($(elem).parent().clone());
}

function addText(elem) {
    setUndoPoint();
    $(elem).siblings().last().append(`<div class="ui fluid action input text" style="margin-top: 0.5rem;">
                            <div style="margin-left: 3rem;" class="ui icon button handle"><i class="ui icon move"></i></div>
                            <textarea class="textarea" rows="1" cols="120" oninput="onEdit(this)"></textarea>
                            <button style="margin-left: 0.25rem;" class="ui red icon button" onclick="removeElem(this);"><i class="ui trash icon"></i></button>
                            <button style="margin-left: 0.25rem;" class="ui red icon button" onclick="duplicateElem(this);"><i class="clone outline icon"></i></button>
                    </div>`);
    update();
}

function onEdit(ref) {
    let lines = ref.value.split("\n");
    /* if (lines.length >= 2) {
         ref.value = lines[0] + "\n" + lines[1];
     } */
}


async function save() {

    let outData = [];
    $("#songeditor .verse").each(function () {
        let title = $(this).find("input").val().toString();
        let texts = [];
        $(this).find("textarea").each(function () {
            let text = $(this).val();
            if (text) {
                texts.push(text);
            }
        });
        if (title && texts) {
            outData.push({ "title": title, "texts": texts });
        }
    });

    let filename = $('#filename').val() || null;
    if (outData.length === 0) {
        alert("Song has no parts, can't save");
        return;
    }

    let songData = {
        title: $("#title").val(),
        artist: $("#artist").val(),
        songData: outData
    };


    if (filename) {
        $.post("/ajax/song/", {
            "filename": filename,
            "data": JSON.stringify(songData)
        }, async function (data) {
            await socket.emit("getData", {});
            window.close();
        }, "text");

    } else {
        alert("You must give a filename for the song to save.");
    }

}