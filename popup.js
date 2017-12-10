var allWindowsMode = false;

var moved = 0;

function setSearchText(tabs) {
  var text = "Search from " + tabs.length + " tabs";
  $("#search").attr("placeholder", text);
}

// updates search box placeholder text
function updateSearchText() {
  if (allWindowsMode) {
    chrome.tabs.query({}, setSearchText);
  } else {
    chrome.tabs.query({currentWindow: true}, setSearchText);
  }
}

function createWindowGroup(windowId) {
  var num_existing_groups = $(".group").length;
  var label = num_existing_groups ? "Window " + (1 + num_existing_groups)
                                  : "Current window";

  var $group = $("<div></div>", {
    "class": "group",
    "data": {
      "windowId": windowId
    }
  });

  if (allWindowsMode) {
    var $label_container = $("<div></div>", {
      "class": "label-container"
    });

    var $label = $("<span></span>", {
      "class": "window-label",
      "text": label
    });

    $label_container.append($label);
    $group.append($label_container);
  }

  return $group;
}

// generates the html for the tab list
function createTabList(tabs) {
  var $container = $("#container");
  var prevWindowId = 0;
  var $group = null;
  tabs.forEach(function(tab) {
    var t = tab.title, u = tab.url;
    if (!u) u = '';
    if (!t) t = u;

    var windowId = tab.windowId;
    if (windowId != prevWindowId) {
      $group = createWindowGroup(windowId);
      $container.append($group);
    }
    prevWindowId = windowId;

    // console.log(tab.windowId, tab.title);

    var $item = $("<div></div>", {
      "tabindex": 0,
      "class": 'item' + (tab.selected ? ' selected' : ''),
      "data": {
        "tabId": tab.id,
        "url": u,
        "keywords": ((t && t != u ? t : '') + ' ' + (u || '')).toLowerCase()
      },
      "on": {
        "click": function(e) {
          if (!e.button && !moved) {
            chrome.tabs.update($(e.currentTarget).data("tabId"), { selected : true });
            chrome.windows.update($(e.currentTarget).parent().data("windowId"), { focused : true });
          }
          if (e.button == 1) {
            closeTab(e, e.currentTarget);
          }
        },
        "keyup": function(e) {
          if (e.keyCode == 13)  // Enter
            chrome.tabs.update($(e.currentTarget).data("tabId"), { selected : true });
          if (e.keyCode == 46)  // Delete
            closeTab(e, e.currentTarget);
        },
        "mousedown": function(e) {
          if (!e.button) {
            moved = 0;
          }
        },
      }
    });

    // favicon
    // note: must set alt to "" to avoid Chrome rendering title as alt if the
    // image is unavailable (since around 60.x).
    $item.append($("<img></img>", {"src": tab.favIconUrl, "title": u, "alt": ""}));

    // text
    $item.append($("<div></div>", {"class": "title", "title": t, "text": t}));

    // close button
    $item.append($("<div></div>", {
      "class": "close",
      "title": "Close Tab",
      "text": "x",
      "on": {
        "click": function(e) {
          closeTab(e, e.currentTarget.parentNode);
        }
      }
    }));

    $group.append($item);
  });

  // bind event listeners. note that they must be done here because this
  // function is called async'ed.
  bindEventListeners();

  $('#search').trigger("focus");

  workaroundCrbug428044();
}

// See crbug.com/428044 and crbug.com/307912, and crbug.com/728174
function workaroundCrbug428044() {
  // Mac OS only
  chrome.runtime.getPlatformInfo(info => {
    if (info.os === 'mac') {
      setTimeout(function() {
        $("body").width($("body").width() + 1);
      }, 100);
    }
  });
}

// binds all the event listeners
function bindEventListeners() {
  $('.item, #search').on("keydown", function(e) {
    if (e.ctrlKey || e.altKey || e.shiftKey)
      return;
    var s = e.currentTarget, p;
    if (e.keyCode == 38) p = 'previousSibling';  // Up
    else if (e.keyCode == 40) p = 'nextSibling';  // Down
    else return;
    while (s = s[p])
      if (s.focus && getComputedStyle(s).display != 'none')
        return s.focus();
  });

  // search
  $('#search').on('keyup change', function(e) {
    var v = $(this).val();
    if (v) {
      $('#container').sortable('disable');
      v = v.toLowerCase().split(' ');
      $('.item').each(function() {
        for (var i = 0; i < v.length; i++) {
          if ($(this).data("keywords").indexOf(v[i]) == -1) {
            $(this).css('display', 'none');
            break;
          }
        }
        if (i >= v.length) {
          $(this).css('display', 'block');
        }
      });
    } else {
      $('.item').css('display', 'block');
      $('#container').sortable('enable');
    }
  });

  // makes the tab list sortable with drag-and-drop
  $('#container').sortable({
    // forcePlaceholderSize: true,
    opacity: .7,
    distance: 5,
    scroll: false,
    axis: 'y',
    items: '.item',
    cancel: '.close',
    start: function() {
      moved = 1;
    },
    stop: function() {
    },
    update: function(event, ui) {
      $(".item", ui.item.parent()).each(function(index) {
        if (ui.item.data("tabId") == $(this).data("tabId")) {
          chrome.tabs.move(
            ui.item.data("tabId"), {
              "windowId": ui.item.parent().data("windowId"),
              "index": index
            }, function(tab) {
              // TODO: focus if the current tab is moved to another window (how about
              // the original focused tab in that window?)

              // refresh the popup if something going wrong
              chrome.tabs.get(tab.id, function(t) {
                if (t.index != index) location.reload();
              });
            }
          );
        }
      });
    }
  });
}

// closes tab and removes it from the list
function closeTab(e, tab) {
  chrome.tabs.remove($(tab).data("tabId"), function() {
    $(tab).remove();
    updateSearchText();
  });

  e.stopPropagation();
  e.preventDefault();
}

// main function
$(function() {
  chrome.storage.sync.get({
    "allWindowsMode": false  // default value
  }, function(items) {
    allWindowsMode = items.allWindowsMode;  // set globally

    updateSearchText();

    chrome.tabs.query({currentWindow: true}, function(tabs) {
      createTabList(tabs);
      if (allWindowsMode) {
        // create groups for other windows after the current window
        chrome.tabs.query({currentWindow: false}, function(tabs) {
          createTabList(tabs);
        });
      }
    });
  });
});
