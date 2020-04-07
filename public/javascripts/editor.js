$(() => {
    $.getJSON("/ajax/song/" + "{{ song }}", function (songData) {
        let output = "";
        for (var data of songData) {
            output += `<div class="ui segment verse">
                    <div class="ui fluid labelled action input">                  
                        <label class="ui label">Osan otsikko</label>
                        <input type="text" value="${data.title}" />
                        <button class="ui red inverted icon button" onclick="removeElem($(this).parent());"><i class="ui icon delete"></i>Delete part</button>
                    </div>
                
                    <div class="verseContent">
                `;
            for (var line of data.texts) {
                output += `<div class="ui fluid action input">
                            <textarea rows="1" cols="120">${line}</textarea>
                            <button class="ui red inverted icon button" onclick="removeElem(this);"><i class="ui icon delete"></i></button>
                    </div>`;
            }
            output += `</div>`;
            output += `<button class="ui green inverted icon button" onclick="addText(this);"><i class="ui icon add"></i></button>`;
            output += `</div>`;

        }
        output += ``;
        $('#songeditor').html(output);
    });

});
var undoData = null;

function removeElem(elem) {
    undoData = $("#songeditor").clone();
    $(elem).parent().remove();
}


function addVerse() {
    undoData = $("#songeditor").clone();
    output = `<div class="ui segment verse">
                    <div class="ui fluid labelled action input">                  
                        <label class="ui label">Title</label>
                        <input type="text" value="" />
                        <button class="ui red inverted icon button" onclick="removeElem($(this).parent());"><i class="ui icon delete"></i>Delete part</button>
                    </div>
                
                    <div class="verseContent">
                    </div>
                    <button class="ui green inverted icon button" onclick="addText(this);"><i class="ui icon add"></i></button>
                    </div>
                `;
    $("#songeditor").append(output);
}


function redo() {
    if (undoData !== null) {
        $("#songeditor").html(undoData);
    }
}

function addText(elem) {
    undoData = $("#songeditor").clone();
    $(elem).siblings().last().append(`<div class="ui fluid action input">
                            <textarea rows="1" cols="120"></textarea>
                            <button class="ui red inverted icon button" onclick="removeElem(this);"><i class="ui icon delete"></i></button>
                    </div>`);
}

function save() {

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

    if (filename) {
        $.post("/ajax/song/", {
            "filename": filename,
            "data": JSON.stringify(outData)
        }, function (data) {
            window.close();
        }, "text");

    } else {
        alert("You must give a filename for the song to save.");
    }

}