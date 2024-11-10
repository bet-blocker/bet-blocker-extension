if (
  typeof window.browser === 'undefined' &&
  typeof window.chrome === 'object'
) {
  window.browser = window.chrome;
}

const onButton = document.querySelector('#on-button');
const offButton = document.querySelector('#off-button');
let betBlockOn = false;

function setStatus(on, saveToStorage) {
  betBlockOn = on;

  if (on) {
    onButton.classList.add('is-info');
    offButton.classList.remove('is-info');
  } else {
    onButton.classList.remove('is-info');
    offButton.classList.add('is-info');
  }

  if (saveToStorage) {
    browser.storage.sync.set({ on: on }, function () {
      var error = browser.runtime.lastError;
      if (error) {
        console.error('Failed to set the status:', error.message);
      }
    });
  }
}

function restoreSettings() {
  browser.storage.sync.get({ on: true }, function (items) {
    const error = browser.runtime.lastError;
    if (error) {
      console.error('Failed to retrieve settings:', error.message);
    } else {
      setStatus(items.on, false);
    }
  });
}
document.addEventListener('DOMContentLoaded', restoreSettings);
onButton.addEventListener('click', function () {
  if (!betBlockOn) {
    setStatus(true, true);
  }
});
offButton.addEventListener('click', function () {
  if (betBlockOn) {
    setStatus(false, true);
  }
});
document.querySelector('#options-link').addEventListener('click', function () {
  if (browser.runtime.openOptionsPage) {
    browser.runtime.openOptionsPage();
  } else {
    window.open(browser.runtime.getURL('options.html'));
  }
});
