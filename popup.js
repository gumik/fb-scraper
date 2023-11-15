
console.log("Adding listener")
document.addEventListener("click", (e) => {
	console.log("click")
	if (e.target.tagName.toLowerCase() === "button" && e.target.textContent === "Run") {
		console.log("Run click")
		startScraping();
	}
});

function startScraping() {
	console.log("startScraping")
	browser.tabs
        .query({ active: true, currentWindow: true })
        .then(function(tabs) {
			if (tabs.length != 1) {
				putResult("Please open exactly one Facebook tab");
				return;
			}

			let fbTab = tabs[0];
			putResult("Facebook tab found: " + fbTab.title)
			browser.tabs.executeScript(fbTab.id, {"file": "scrapper.js"}, handleResult);
		})
}

function handleResult(results) {
	console.log("results:")
	console.log(results);

	if (results && results.length != 0 && results[0]) {
		let result = results[0];

		putResult(result.output);
	} else {
		putResult("ERROR: No response from the script.");
	}
}

function putResult(x) {
	let resultsNode = document.getElementById('results');
	resultsNode.innerText = x;
}
