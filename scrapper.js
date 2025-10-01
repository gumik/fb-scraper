
async function getPosts() {
    let feed = document.evaluate("//div[@role='feed']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
    console.log("feed length: " + feed.children.length)
	let result = [];
	let lastPostNumber = 0;
	let done = false;
	let count = 0;
	let firstPost = (await browser.storage.local.get("scrap_start")).scrap_start;
	console.log("firstPost: " + firstPost)
	console.log(firstPost);

    for (let i = firstPost; i < feed.children.length && count < 10; i++) {
		count++;
        console.log("post " + i)
		lastPostNumber = i;
        let post = feed.children[i]

        post.scrollIntoView()
		await waitUntil(() => post.children.length)

        //text = document.evaluate(".//div[@data-ad-preview='message']", post, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
        let authorNode = document.evaluate(".//h3", post, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        if (authorNode == null) {
            continue
        }
        let author = authorNode.textContent

        let links = document.evaluate(".//a", post, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)

		const maxLinks = 4;
        for (let j = 0; j < links.snapshotLength && j < maxLinks; j++) {
            link = links.snapshotItem(j)

            let event = new FocusEvent('focusin', {
                'view': window,
                'bubbles': true,
                'cancelable': true
            });

            link.dispatchEvent(event);
        }

		let postLinkNode = await waitUntil(() => {
			let value = null;
			for (let j = 0; j < links.snapshotLength && j < maxLinks; j++) {
				link = links.snapshotItem(j);
				if (link.attributes['href'].nodeValue.includes("/posts/")) {
					value = link;
					break;
				}
			}
			return value;
		})

        if (!postLinkNode) {
            console.log("no post link found")
			done = true;
            break
        }

        let date = getFirstText(postLinkNode)
        let postLink = postLinkNode.attributes['href'].nodeValue.split("?")[0]

		console.log("looking for textNode")
		let textNode = await waitUntil(() => {
			return document.evaluate(".//div[text() != '']", post, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
		});
		let initialTextNode = textNode;
		console.log("initial textNode")
		console.log(textNode)
		while (textNode != null && textNode.nodeName.toLowerCase() != "span") {
			console.log("textNode: " + textNode)
			textNode = textNode.parentElement;
		}
		if (textNode == null) {
			textNode = initialTextNode;
		}
		let text = textNode.textContent;

        // Log date, author, link
        console.log(date + " " + author + " " + postLink)
		result.push({
			date: date,
			author: author,
			link: postLink,
			text: text
		})
    }

	return {result: result, lastPostNumber: lastPostNumber, done: done};
}

async function waitUntil(func) {
	console.log("waitUntil")
	let timeout = 10000;
	let begin = new Date().getTime();
	console.log("waitUntil, begin: " + begin)
	let result = func();

	console.log("waitUntil, result: " + result)
	while (!result && new Date().getTime() - begin < timeout) {
		let sleepTime = Math.random() * 1000;
		console.log("waitUntil, sleep: " + sleepTime)
		await sleep(sleepTime);
		result = func();
		console.log("waitUntil, result: " + result)
	}

	return result;
}

function getFirstText(elem) {
    console.log("getFirstText: " + elem.nodeName)
    if (elem.nodeName.toLowerCase() == "text") {
        return elem.textContent
    }

    if (elem.nodeName.toLowerCase() == "use") {
        href = elem.attributes['href']
        if (!href) {
            href = elem.attributes['xlink:href']
        }
        href = href.value

        if (href[0] == "#") {
            href = href.substring(1)
        }

        useElem = document.evaluate("//*[@id='" + href + "']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        return getFirstText(useElem)
    }

    for (let i = 0; i < elem.children.length; i++) {
        text = getFirstText(elem.children[i])
        if (text) {
            return text
        }
    }

    return null
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
	var result = new Object();
	try {
		result.debug = "I'm alive!";
		let getPostsResult = await getPosts();
		result.output = getPostsResult.result;
		result.lastPostNumber = getPostsResult.lastPostNumber;
		result.done = getPostsResult.done;
	} catch (e) {
		result.debug = e;
	}
	return result;
})();
