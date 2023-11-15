
async function getPosts() {
    let feed = document.evaluate("//div[@role='feed']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
    console.log("feed length: " + feed.children.length)
	let result = [];

    for (let i = 1; i < feed.children.length && i < 2; i++) {
        console.log("post " + i)
        post = feed.children[i]
        post.scrollIntoView()
        await sleep(500)

        //text = document.evaluate(".//div[@data-ad-preview='message']", post, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
        authorNode = document.evaluate(".//h3", post, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        if (authorNode == null) {
            continue
        }
        author = authorNode.textContent

        links = document.evaluate(".//a", post, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
        postLinkNode = null

        for (let j = 0; j < links.snapshotLength; j++) {
            link = links.snapshotItem(j)

            let event = new FocusEvent('focusin', {
                'view': window,
                'bubbles': true,
                'cancelable': true
            });

            link.dispatchEvent(event);
        }

        for (let j = 0; j < links.snapshotLength; j++) {
            link = links.snapshotItem(j)
            // if link is of form ".../groups/.../posts/..." then it is the link to the post
            if (link.attributes['href'].nodeValue.includes("/posts/")) {
                postLinkNode = link
                break
            }
        }

        if (!postLinkNode) {
            console.log("no post link found")
            break
        }

        date = getFirstText(postLinkNode)
        postLink = postLinkNode.attributes['href'].nodeValue

        // Log date, author, link
        console.log(date + " " + author + " " + postLink)
		result.push({
			date: date,
			author: author,
			link: postLink
		})
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
	result.debug = "I'm alive!";
	result.output = await getPosts();
	return result;
})();
