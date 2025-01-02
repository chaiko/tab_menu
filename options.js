const options = [
  { id: "allWindowsMode", title: "Show tabs of all windows", checked: false }
];

function loadOptions() {
  const container = document.getElementById("options-container");

  options.forEach(option => {
    // Create a checkbox and label for each option
    const label = document.createElement("label");
    label.className = "option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = option.id;

    // Set the initial state from storage
    chrome.storage.sync.get(option.id, (stored) => {
      checkbox.checked = stored[option.id] || false;
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(option.title));
    container.appendChild(label);
  });
}

// Save options dynamically and show confirmation message
function saveOptions() {
  const settings = {};

  options.forEach(option => {
    const checkbox = document.getElementById(option.id);
    if (checkbox) {
      settings[option.id] = checkbox.checked;
    }
  });

  chrome.storage.sync.set(settings, () => {
    showSaveMessage("Options saved!");
  });
}

// Show a confirmation message
function showSaveMessage(message) {
  // Create a message element
  const messageElement = document.getElementById("status");
  messageElement.textContent = message;
  messageElement.style.opacity = "1";

  // Fade out after 1.5 seconds
  setTimeout(() => {
    messageElement.style.opacity = "0";
  }, 1500);
}

// Add event listener for Save button
document.getElementById("save").addEventListener("click", saveOptions);

// Initialize the options page
document.addEventListener("DOMContentLoaded", loadOptions);
