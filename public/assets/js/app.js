//scrape button!
$("#scrape").on("click", function() {

    $.ajax({
        method: "GET",
        url: "/scrape",
    }).done(function(data) {
        console.log(data)
        window.location = "/"
    })
});

//article save button
$(".save").on("click", function() {
    var thisId = $(this).attr("data-id");

    $.ajax({
        method: "POST",
        url: "/articles/save/" + thisId
    }).done(function(data) {
        window.location = "/"
    })
});

//article delete button
$(".delete").on("click", function() {
    var thisId = $(this).attr("data-id");

    $.ajax({
        method: "DELETE",
        url: "/articles/delete/" + thisId
    }).done(function(data) {
        window.location = "/"
    })
});


//save comment button
$(".saveComment").on("click", function() {
    var thisId = $(this).attr("data-id");

    if(!$("#commentText" + thisId).val()) {
        alert("Error, No Comment Entered");
    } else {
        $.ajax({
            method: "POST",
            url: "/comments/save/" + thisId,
            data: {
                text: $("#commentText" + thisId).val()
            }
        }).done(function(data) {
            // check comment
            console.log(data);

            $("#commentText" + thisId).val()
            $(".modalcomment").modal("hide");
            window.location = "/saved"
        });
    }
})


//delete comment button
$(".deleteComment").on("click", function() {
    var commentId = $(this).attr("data-comment-id");
    var articleId = $(this).attr("data-article-id");

    $.ajax({
        method: "DELETE",
        url: "/comments/delete/" + commentId + "/" + articleId
    }).done(function(data) {
        console.log(data);

        $(".modalComment").modal("hide");
        window.location = "/saved"
    })
})
