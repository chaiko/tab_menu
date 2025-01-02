// Default value.
const options = [
  { id: "allWindowsMode", title: "Show tabs of all windows", checked: false }
];

function createContextMenu() {
  // Clear existing context menus
  chrome.contextMenus.removeAll(() => {
    options.forEach(x => {
      chrome.contextMenus.create({
        id: x.id,
        title: x.title,
        type: "checkbox",
        checked: x.checked,
        contexts: ["all"]
      });
    });
  });
}

// Load saved options from storage
function loadOptions() {
  chrome.storage.sync.get(options.map(x => x.id), (stored) => {
    options.forEach(x => {
      if (stored[x.id] !== undefined) {
        x.checked = stored[x.id];
      }
    });
    createContextMenu();
  });
}

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const option = options.find(x => x.id === info.menuItemId);
  if (option) {
    option.checked = !option.checked;

    // Save the updated state
    chrome.storage.sync.set({ [option.id]: option.checked }, () => {
      console.log(`${option.title} is now ${option.checked ? "enabled" : "disabled"}`);
    });

    // Update context menu to reflect the new state
    createContextMenu();
  }
});

// Listen for storage changes and update the context menu
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    for (const key in changes) {
      const option = options.find(o => o.id === key);
      if (option) {
        option.checked = changes[key].newValue;
      }
    }
    createContextMenu();
  }
});

loadOptions();

