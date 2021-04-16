const urlLivebar = 'https://www.dolomitenstadt.at/api/livebar/?_=' + new Date().getTime();
const urlPosts = 'https://www.dolomitenstadt.at/api/load/posts/';
let postCount = 50;
let comments = [];
let posts = [];

function main() {
    document.body.innerHTML = '';
    document.write('Amount of posts: <input type="number" id="amountPosts" value="' + postCount + '"></input><br>');
    document.write('<button onclick="start()">Start</button><br>');
}

async function start() {
    let input = document.getElementById("amountPosts").value;
    if (!isNaN(input)) {
        postCount = input;
    }

    posts = getPosts().filter(url => url.includes('www.dolomitenstadt.at')).concat(getLivebarLinks());

    for (let i = 0; i < posts.length; i++) {
        comments = comments.concat(await getComments(posts[i]));
        console.log(Math.floor(100 * (i + 1) / posts.length) + '%');
    }
    displayFilterMenu(null);
}

function displayFilterMenu(amountFound) {
    document.body.innerText = '';
    document.write('<h1>Regex-Filter</h1>')
    document.write('Posts: ' + posts.length + '<br>');
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
    if(amountFound != null) {
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
    let doc = new DOMParser().parseFromString(httpRequest('GET', url), 'text/html');
    let comments = Array.from(doc.getElementsByClassName("comments__item__right"));
    let allComments = [];
    for (let i = 0; i < comments.length; i++) {
        let commentElement = comments[i];
        let author = commentElement.children[0].children[0].innerText;
        let commentText = Array.from(commentElement.children[1].children).map(elm => elm.innerText).join(" ");
        let datePosted = commentElement.children[0].children[1].title;
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

function getPosts() {
    let links = [];
    let ids = [];
    let requestPayload = 'load_category=&load_count=26&load_tag=&load_exclude=<%EXCLUDE%>&load_search_term=';
    let data = JSON.parse(httpRequest('POST', urlPosts, requestPayload.replace('<%EXCLUDE%>', ''))).data;
    links = data.map(item => item.link);
    ids = data.map(item => item.id);

    while (links.length < postCount) {
        let excluded = ids.join('%7C');
        let payload = requestPayload.replace('<%EXCLUDE%>', excluded);
        let response = JSON.parse(httpRequest('POST', urlPosts, payload)).data;
        if (response.length == 0) {
            console.log('Max Urls');
            break;
        }
        links = links.concat(response.map(item => item.link));
        ids = ids.concat(response.map(item => item.id));
        console.log('Post Count: ' + links.length);
    }
    return links;
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