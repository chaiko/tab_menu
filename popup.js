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
  tabs.forEach(function(tab) {
    var t = tab.title, u = tab.url;
    if (!u) u = '';
    if (!t) t = u;

    var item = $("<div></div>", {
      "tabindex": 0,
      "class": 'item' + (tab.selected ? ' selected' : ''),
      "data": {
        "tabId": tab.id,
        "url": u,
        "keywords": ((t && t != u ? t : '') + ' ' + (u || '')).toLowerCase()
      }
    });

    // favicon
    if (tab.favIconUrl) {
      $(item).append($("<img></img>", {"src": tab.favIconUrl, "title": u}));
    } else {
      // avoid Chrome rendering "title" attribute as alt text since around 60.x
      $(item).append($("<img></img>"));
    }

    // text
    $(item).append($("<div></div>", {"class": "title", "title": t, "text": t}));

    // close button
    $(item).append($("<div></div>", {
      "class": "close",
      "title": "Close Tab",
      "text": "x",
      "on": {
        "click": function(e) {
          closeTab(e, e.currentTarget.parentNode);
        }
      }
    }));

    $("#main").append(item);
  });

  anim();
}

// binds all the event listeners
function anim() {
  $('.item').on("click", function(e) {
    if (!e.button && !moved) {
      chrome.tabs.update($(e.currentTarget).data("tabId"), { selected : true });
    }
    if (e.button == 1) {
      closeTab(e, e.currentTarget);
    }
  });

  $('.item').on("mousedown", function(e) {
    if (!e.button) {
      $("#main").data("tabId", $(e.currentTarget).data("tabId"));
      moved = 0;
    }
  });

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

  $('.item').on("keyup", function(e) {
    if (e.keyCode == 13)  // Enter
      chrome.tabs.update($(e.currentTarget).data("tabId"), { selected : true });
    if (e.keyCode == 46)  // Delete
      closeTab(e, e.currentTarget);
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
    }
    else {
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
      if (!document.body.className)
        document.body.style.cssText = 'overflow-y: hidden';
      moved = 1;
    },
    stop: function() {
      document.body.style.cssText = '';
    },
    update: function() {
      if ($("#main").data("tabId")) {
        $(".item").each(function(i) {
          if ($("#main").data("tabId") == $(this).data("tabId")) {
            chrome.tabs.move(
              $("#main").data("tabId"), { index: i },
              function(tab) {
                chrome.tabs.get(tab.id, function(t) {
                  if (t.index != i)
                    location.reload();
                  else if (document.documentElement.className == 'osx')
                    chrome.tabs.create({ selected : false },
                                       function(t) { chrome.tabs.remove(t.id); });
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

// suppresses typing while not focused
function mute(e) {
  if (document.activeElement != $('#search')[0] && e.keyCode != 9)  // 9: Tab
    e.preventDefault();
}

// checks for page overflow
function mode() {
  var noscroll = document.body.clientWidth < innerWidth ? 'overflow' : '';
  if (document.body.className != noscroll)
    document.body.className = noscroll;
}

$(function() {
  if (~navigator.userAgent.indexOf('Macintosh'))
    document.documentElement.className = 'osx';

  updateSearchText();

  chrome.tabs.query({currentWindow: true}, createTabList);

  $('#search').trigger("focus");

  onkeydown = onkeypress = mute;

  mode();
  setInterval(mode, 50);
});
