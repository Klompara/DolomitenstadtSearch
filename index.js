const urlLivebar = 'https://www.dolomitenstadt.at/api/livebar/?_=' + new Date().getTime();
const urlPosts = 'https://www.dolomitenstadt.at/api/load/posts/';
let postCount = 50;
let comments = [];
let posts = [];
let parser = new DOMParser();

function main() {
    document.body.innerHTML = '';
    document.write('<h1>Comment and author search tool</h1>');
    document.write('Amount of posts: <input type="number" id="amountPosts" value="' + postCount + '"></input><br>');
    document.write('<button onclick="start()">Start</button><br><br>');
    document.write('or<br>');
    document.write('<input type="file" id="fileInput" onchange="openFile(this.files)" accept="application/json"></input><br><br>');
    document.write('<div id="myProgress" style="width: 100%; background-color: grey;"><div id="myBar" style="width: 0%;height: 30px;background-color: green; text-align: center; line-height: 30px; color: white;"></div></div>');
}

function openFile(files) {
    var reader = new FileReader();
    reader.readAsText(files[0], 'UTF8');
    reader.onload = function (evt) {
        let result = JSON.parse(evt.target.result);
        for (let i = 0; i < result.length; i++) {
            let comment = result[i];
            if (!(comment.hasOwnProperty('author') && comment.hasOwnProperty('comment') && comment.hasOwnProperty('url') && comment.hasOwnProperty('datePosted'))) {
                alert('Not a valid dataset!');
                console.log(comment);
                return;
            }
        }
        comments = result;
        displayFilterMenu(null);
    }
}

async function start() {
    let input = document.getElementById("amountPosts").value;
    if (!isNaN(input)) {
        postCount = input;
    }
    getPosts();
}

function finishedGetPosts() {
    posts = posts.filter(url => url.includes('www.dolomitenstadt.at')).concat(getLivebarLinks());
    document.write('<br>Fetching Comments..');
    collectComments();
}

let postCounter = 0;
let repeater;
async function collectComments() {
    if (postCounter < posts.length) {
        let newComments = await getComments(posts[postCounter]);
        for (let j = 0; j < newComments.length; j++) {
            comments.push(newComments[j]);
        }
        let bar = document.getElementById("myBar");
        let percent = Math.floor(100 * (postCounter + 1) / posts.length) + '%';
        bar.style.width = percent;
        bar.innerHTML = percent;
        postCounter++;
        repeater = requestAnimationFrame(collectComments);
    } else {
        cancelAnimationFrame(repeater);
        displayFilterMenu(null);
    }
}

function displayFilterMenu(amountFound) {
    document.body.innerText = '';
    document.write('<h1>Regex-Filter</h1>')
    document.write('<button onclick="main()">Back to menu</button><br>');
    document.write('Posts with comments: ' + posts.length + '<br>');
    document.write('Comments: ' + comments.length + ' <a id="downloadAnchorElem">Download</a><br><br>');
    document.write('Filter Author: <input type="text" id="inputAuthor"></input><br>');
    document.write('global match<input type="checkbox" id="filterAuthorGlobalMatch" checked></input><br>');
    document.write('case-insensitive<input type="checkbox" id="filterAuthorCase" checked></input><br>');
    document.write('multiline<input type="checkbox" id="filterAuthorMultiline" checked></input><br><br>');
    document.write('Filter Comment: <input type="text" id="inputComment"></input><br>');
    document.write('global match<input type="checkbox" id="filterCommentGlobalMatch" checked></input><br>');
    document.write('case-insensitive<input type="checkbox" id="filterCommentCase" checked></input><br>');
    document.write('multiline<input type="checkbox" id="filterCommentMultiline" checked></input><br><br>');
    document.write('<button onclick="filter()">Filter</button><br>');
    if (amountFound != null) {
        document.write('<span style="color:' + (amountFound == 0 ? 'red' : 'green') + '">Found ' + amountFound + ' matching comments</span>');
    }
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(comments));
    let dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "dataset.json");
}

function filter() {
    let filterAuthorGlobalMatch = document.getElementById('filterAuthorGlobalMatch').checked;
    let filterAuthorCase = document.getElementById('filterAuthorCase').checked;
    let filterAuthorMultiline = document.getElementById('filterAuthorMultiline').checked;
    let filterCommentGlobalMatch = document.getElementById('filterCommentGlobalMatch').checked;
    let filterCommentCase = document.getElementById('filterCommentCase').checked;
    let filterCommentMultiline = document.getElementById('filterCommentMultiline').checked;
    let regexAuthor = new RegExp(document.getElementById('inputAuthor').value, (filterAuthorGlobalMatch ? 'g' : '') + (filterAuthorCase ? 'i' : '') + (filterAuthorMultiline ? 'm' : ''));
    let regexComment = new RegExp(document.getElementById('inputComment').value, (filterCommentGlobalMatch ? 'g' : '') + (filterCommentCase ? 'i' : '') + (filterCommentMultiline ? 'm' : ''));
    console.log(regexAuthor);
    console.log(regexComment);
    let filtered = comments.filter(obj => regexAuthor.test(obj.author) && regexComment.test(obj.comment));
    displayFilterMenu(filtered.length);
    for (let i = 0; i < filtered.length; i++) {
        printComment(filtered[i]);
    }
}

function printComment(comment) {
    document.write('<br>');
    document.write('<br>');
    document.write('<br>');
    document.write('Author: <b>' + comment.author + '</b>');
    document.write('<br>');
    document.write('Date: <b>' + comment.datePosted + '</b>');
    document.write('<br>');
    document.write('Comment: ' + comment.comment);
    document.write('<br>');
    document.write('<a href="' + comment.url + '" target="_blank">Link</a>');
    document.write('<br>');
}

async function getComments(url) {
    let doc = parser.parseFromString(httpRequest('GET', url), 'text/html');
    let commentsFromDoc = Array.from(doc.getElementsByClassName("comments__item__right"));
    let allComments = [];
    for (let i = 0; i < commentsFromDoc.length; i++) {
        let commentElement = commentsFromDoc[i];
        let author = commentElement.children[0].children[0].innerText;
        let commentText = Array.from(commentElement.children[1].children).map(elm => elm.innerText).join(" ");
        let datePosted = commentElement.children[0].children[commentElement.children[0].children.length - 1].title;
        allComments.push({ 'author': author, 'comment': commentText, 'url': url, 'datePosted': datePosted });
    }
    return new Promise((resolve, reject) => {
        resolve(allComments);
    });
}

function getLivebarLinks() {
    let data = JSON.parse(httpRequest('GET', urlLivebar, null));
    let links = [];
    for (let i = 0; i < data.data.items.length; i++) {
        let item = data.data.items[i];
        links.push(item.link);
    }
    return links;
}

let ids = [];

function getPosts() {
    document.write('Fetching Posts...');
    let requestPayload = 'load_category=&load_count=26&load_tag=&load_exclude=<%EXCLUDE%>&load_search_term=';
    let data = JSON.parse(httpRequest('POST', urlPosts, requestPayload.replace('<%EXCLUDE%>', ''))).data;
    posts = data.map(item => item.link);
    ids = data.map(item => item.id);
    getPostsLoading();
}

function getPostsLoading() {
    if (posts.length < postCount) {
        let requestPayload = 'load_category=&load_count=26&load_tag=&load_exclude=<%EXCLUDE%>&load_search_term=';
        let excluded = ids.join('%7C');
        let payload = requestPayload.replace('<%EXCLUDE%>', excluded);
        let response = JSON.parse(httpRequest('POST', urlPosts, payload)).data;
        if (response.length == 0) {
            document.write('<br>Maximum amount of posts with comments reached: ' + posts.length);
            postCount = 0;
        } else {
            posts = posts.concat(response.filter(item => item.comments != 0).map(item => item.link));
            ids = ids.concat(response.map(item => item.id));

            let bar = document.getElementById("myBar");
            let percent = Math.floor(posts.length / postCount * 100) + '%';
            bar.style.width = percent;
            bar.innerHTML = percent;
        }
        repeater = window.requestAnimationFrame(getPostsLoading);
    } else {
        cancelAnimationFrame(repeater);
        finishedGetPosts();
    }
}

function httpRequest(method, url, data) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open(method, url, false);
    xmlHttp.setRequestHeader('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
    xmlHttp.send(data);
    return xmlHttp.responseText;
}

// https?:\/\/[^(cdnjs.cloudflare.com)] regex for links which aren't smileys

setTimeout(main(), 0);