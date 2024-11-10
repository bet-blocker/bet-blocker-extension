if (
  typeof window.browser === 'undefined' &&
  typeof window.chrome === 'object'
) {
  window.browser = window.chrome;
}

let reenableTimeoutId = null;
let defaultRules = [];

function loadDefaultRules() {
  fetch('https://raw.githubusercontent.com/bet-blocker/bet-blocker/main/blocklist.txt')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(data => {
      defaultRules = data.split('\n')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0)
        .map(domain => ({ domain, path: '' }));
      console.log('Default rules loaded:', defaultRules);
    })
    .catch(error => {
      console.error('Error loading default rules:', error);
      // Em caso de erro, carrega as regras locais  (blocked.json) como fallback
      loadLocalDefaultRules();
    });
}

function loadLocalDefaultRules() {
  fetch(browser.runtime.getURL('blocked.json'))
    .then(response => response.json())
    .then(data => {
      defaultRules = data.rules;
      console.log('Local default rules loaded:', defaultRules);
    })
    .catch(error => {
      console.error('Error loading local default rules:', error);
      defaultRules = []; 
    });
}

loadDefaultRules();

function changeIcon(on) {
  const status = on ? 'on' : 'off';

  browser.browserAction.setIcon({
    path: {
      16: `images/icon-16-${status}.png`,
      48: `images/icon-48-${status}.png`,
      128: `images/icon-128-${status}.png`
    }
  });
}

browser.storage.sync.get({ on: true }, function (items) {
  if (!items.on) {
    changeIcon(false);
  }
});

browser.webNavigation.onCommitted.addListener(function (details) {
  if (details.frameId !== 0) {
    return;
  }

  var storageQuery = {
    rules: [],
    allowedTabId: -1,
    on: true
  };

  browser.storage.sync.get(storageQuery, function (items) {
    var error = browser.runtime.lastError;
    if (error) {
      console.error('Failed to get data from storage:', error);
      return;
    }

    if (!items.on) {
      return;
    }

    if (items.allowedTabId === details.tabId) {
      browser.storage.sync.remove('allowedTabId');
      return;
    }

    var targetUrl = new URL(details.url);
    var targetDomain = targetUrl.hostname.replace(/^www\./, '');

    const allRules = [...defaultRules, ...items.rules];

    for (var rule of allRules) {
      var block = false;

      var domainRegex = new RegExp(rule.domain);
      if (domainRegex.test(targetDomain)) {
        if (!rule.path) {
          block = true;
        } else {
          var pathRegex = new RegExp(rule.path);
          block = pathRegex.test(targetUrl.pathname);
        }
      }

      if (block) {
        var blockedUrl = encodeURIComponent(details.url);
        var blockPageUrl = browser.runtime.getURL(
          'block.html?target=' + blockedUrl
        );

        browser.tabs.insertCSS(details.tabId, {
          code: '* { display: none !important; }',
          runAt: 'document_start'
        });

        browser.tabs.executeScript(details.tabId, {
          code: 'window.location.replace("' + blockPageUrl + '");',
          runAt: 'document_start'
        });

        break;
      }
    }
  });
});

browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.closeTab && sender.tab && sender.tab.id) {
    browser.tabs.remove(sender.tab.id);
    return;
  }

  if (sender.tab && sender.tab.id) {
    browser.storage.sync.set({ allowedTabId: sender.tab.id }, function () {
      var error = browser.runtime.lastError;
      sendResponse({ error: Boolean(error) });
    });

    return true;
  } else {
    sendResponse({ error: true });
  }
});

browser.storage.onChanged.addListener((changes) => {
  if (
    changes.reenableMinutes &&
    !changes.reenableMinutes.newValue &&
    reenableTimeoutId
  ) {
    clearTimeout(reenableTimeoutId);
  }

  if (!changes.on) {
    return;
  }

  changeIcon(changes.on.newValue);

  if (changes.on.newValue) {
    if (reenableTimeoutId) {
      clearTimeout(reenableTimeoutId);
    }
  } else {
    browser.storage.sync.get('reenableMinutes', (items) => {
      if (items.reenableMinutes) {
        reenableTimeoutId = setTimeout(() => {
          browser.storage.sync.set({ on: true });
          reenableTimeoutId = null;
        }, items.reenableMinutes * 60 * 1000);
      }
    });
  }
});

setInterval(loadDefaultRules, 24 * 60 * 60 * 1000);