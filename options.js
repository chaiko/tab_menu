// Saves options to chrome.storage.sync.
function save_options() {
  var mode = $("input[name=window-mode]:checked").val();

  chrome.storage.sync.set({
    windowMode: mode
  }, function() {
    // Update status to let user know options were saved.
    $("#status").text("Options saved.");
    $("#status").show().fadeOut(1500);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    windowMode: "current"  // default value as current
  }, function(items) {
    console.log(items);
    $("input[name=window-mode][value=" + items.windowMode + "]").prop("checked", true);
  });
}

$(function() {
  restore_options();
  $("#save").on("click", save_options);
});
