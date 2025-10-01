
console.log("Adding listener")
document.addEventListener("click", (e) => {
	console.log("click")
	if (e.target.tagName.toLowerCase() === "button") {
		let buttonText = e.target.textContent;
		if (buttonText === "Run") {
			console.log("Run click")
			startScraping();
		} else if (buttonText === "Get") {
			browser.storage.local.get(null).then((result) => {
				putResult(Object.keys(result).length + " posts are stored");
				console.log(JSON.stringify(result));
			});
		} else if (buttonText === "Clear") {
			browser.storage.local.clear().then(() => {
				putResult("Cleared");
			});
		}
	}
});

function startScraping() {
	console.log("startScraping")
	browser.tabs
        .query({ active: true, currentWindow: true })
        .then(async function(tabs) {
			if (tabs.length != 1) {
				putResult("Please open exactly one Facebook tab");
				return;
			}

			let fbTab = tabs[0];
			putResult("Facebook tab found: " + fbTab.title)

			await browser.storage.local.set({scrap_start: 1, scrap_fbTabId: fbTab.id})
			browser.tabs.executeScript(fbTab.id, {"file": "scrapper.js"}).then(handleResult);
		})
}

async function handleResult(results) {
	console.log("results:")
	console.log(results);

	if (results && results.length != 0 && results[0]) {
		let result = results[0];

		// putResult(result.output);

		for (let i = 0; i < result.output.length; ++i) {
			let post = result.output[i];
			console.log("post")
			console.log(post)
			let postKeyValue = new Object();
			let linkParts = post.link.split("/");
			let postId = null;
			for (let j = linkParts.length - 1; j >= 0; --j) {
				let part = linkParts[j];
				console.log("part: " + part)
				if (part != "") {
					postId = part;
					break;
				}
			}
			postKeyValue["id_" + postId] = post;
			// console.log("postKeyValue")
			// console.log(postKeyValue)
			await browser.storage.local.set(postKeyValue).then(() => {
				console.log("Saved post: " + post);
			});
		}

		if (!result.done) {
			let fbTabId = (await browser.storage.local.get("scrap_fbTabId")).scrap_fbTabId;
			await browser.storage.local.set({scrap_start: result.lastPostNumber + 1})
			console.log("fbTabId: ")
			console.log(fbTabId)
			browser.tabs.executeScript(fbTabId, {"file": "scrapper.js"}).then(handleResult);
			putResult("Read " + result.lastPostNumber + " posts")
		} else {
			putResult("Done");
		}
	} else {
		putResult("ERROR: No response from the script.");
	}
}

function putResult(x) {
	let resultsNode = document.getElementById('results');
	resultsNode.innerText = x;
}
