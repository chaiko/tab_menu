chrome.contextMenus.removeAll();

chrome.storage.sync.get({
  "allWindowsMode": false  // default value
}, function(items) {
  chrome.contextMenus.create({
    title: "Show tabs of all windows",
    contexts: ["browser_action"],
    type: "checkbox",
    checked: items.allWindowsMode,
    onclick: function(item) {
      chrome.storage.sync.set({
        "allWindowsMode": item.checked
      });
    }
  });
});
