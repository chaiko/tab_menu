var moved = 0;

// updates search box placeholder text
function updateSearchText() {
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    var text = "Search from " + tabs.length + " tabs";
    $("#search").attr("placeholder", text);
  });
}

// generates the html for the tab list
function createTabList(tabs) {
  var $main = $("#main");
  tabs.forEach(function(tab) {
    var t = tab.title, u = tab.url;
    if (!u) u = '';
    if (!t) t = u;

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
            $("#main").data("tabId", $(e.currentTarget).data("tabId"));
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

    $main.append($item);
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
        setTimeout(function() {
          $("body").width($("body").width() - 1);
        }, 100);
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
      $('#main').sortable('disable');
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
      $('#main').sortable('enable');
    }
  });

  // makes the tab list sortable with drag-and-drop
  $('#main').sortable({
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
    update: function() {
      if ($("#main").data("tabId")) {
        $(".item").each(function(i) {
          if ($("#main").data("tabId") == $(this).data("tabId")) {
            chrome.tabs.move(
              $("#main").data("tabId"), { index: i },
              function(tab) {
                chrome.tabs.get(tab.id, function(t) {
                  if (t.index != i) location.reload();
                });
              });
            $("#main").data("tabId", 0);
          }
        });
      }
    }
  });
}

// closes tab and removes it from the list
function closeTab(e, tab) {
  chrome.tabs.remove($(tab).data("tabId"));
  $(tab).remove();
  updateSearchText();

  e.stopPropagation();
  e.preventDefault();
}

$(function() {
  updateSearchText();
  chrome.tabs.query({currentWindow: true}, createTabList);
});
