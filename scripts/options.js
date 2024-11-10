if (typeof window.browser === 'undefined' && typeof window.chrome === 'object') {
  window.browser = window.chrome;
}

var rules = [];
var defaultRules = [];
var onButton = document.querySelector('#on-button');
var offButton = document.querySelector('#off-button');
var domainInput = document.querySelector('#new-domain');
var pathInput = document.querySelector('#new-path');
var domainError = document.querySelector('#domain-error');
var pathError = document.querySelector('#path-error');

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
      restoreSettings();
    })
    .catch(error => {
      console.error('Error loading default rules:', error);
      // Em caso de erro, tenta carregar as regras locais (blocked.json) como fallback
      loadLocalDefaultRules();
    });
}

function loadLocalDefaultRules() {
  fetch(browser.runtime.getURL('blocked.json'))
    .then(response => response.json())
    .then(data => {
      defaultRules = data.rules;
      restoreSettings();
    })
    .catch(error => {
      console.error('Error loading local default rules:', error);
      defaultRules = []; 
      restoreSettings();
    });
}

loadDefaultRules();

function showErrorMessage(message) {
  var errorMessage = document.querySelector('#generic-error');
  errorMessage.style.display = 'block';
  errorMessage.firstElementChild.textContent = message;
}

function hideErrorMessage() {
  document.querySelector('#generic-error').style.display = 'none';
}

function deleteRule() {
  var row = this.closest('tr');
  var ruleIndex = Array.from(row.parentNode.children).indexOf(row) - defaultRules.length - 1;
  var rule = rules[ruleIndex];
  rules.splice(ruleIndex, 1);
  browser.storage.sync.set({ rules }, function () {
    if (browser.runtime.lastError) {
      showErrorMessage('Failed to delete the rule.');
      rules.splice(ruleIndex, 0, rule);
    } else {
      row.remove();
    }
  });
}

function prependRuletoTable(rule, isDefault) {
  var row = document.querySelector('#rule-row').content.cloneNode(true);
  row.querySelector('td').textContent = rule.domain;
  row.querySelectorAll('td')[1].textContent = rule.path;

  if (isDefault) {
    row.querySelector('.delete-button').disabled = true;
    row.querySelector('tr').classList.add('default-rule');
  } else {
    row.querySelector('.delete-button').onclick = deleteRule;
  }

  document.querySelector('#new-rule-row').parentNode.insertBefore(row, document.querySelector('#new-rule-row').nextSibling);
}

function addRule(domain, path) {
  domain = domain.trim().replace(/https?:|\//g, '').replace(/^www\./, '').toLowerCase();
  if (!/.+\..+/.test(domain)) return { domainError: 'Invalid domain' };
  path = path.trim().toLowerCase();
  if (path && !/^\/.+/.test(path)) return { pathError: 'Invalid path' };

  var newRule = { domain, path: path || '' };
  if (rules.some(rule => rule.domain === newRule.domain && rule.path === newRule.path)) {
    return { duplicate: true };
  }

  rules.unshift(newRule);
  browser.storage.sync.set({ rules }, function () {
    if (browser.runtime.lastError) {
      showErrorMessage('Failed to add the new rule.');
      rules.shift();
    } else {
      prependRuletoTable(newRule, false);
    }
  });
}

function addRuleFromUI() {
  domainInput.classList.remove('is-danger');
  pathInput.classList.remove('is-danger');
  domainError.style.display = 'none';
  pathError.style.display = 'none';

  var result = addRule(domainInput.value, pathInput.value);
  if (result.domainError) {
    domainError.style.display = 'block';
    domainError.textContent = result.domainError;
    domainInput.classList.add('is-danger');
  } else if (result.pathError) {
    pathError.style.display = 'block';
    pathError.textContent = result.pathError;
    pathInput.classList.add('is-danger');
  } else if (result.duplicate) {
    domainError.style.display = 'block';
    domainError.textContent = 'Duplicate rule';
    domainInput.classList.add('is-danger');
    pathInput.classList.add('is-danger');
  } else {
    domainInput.value = '';
    pathInput.value = '';
    domainInput.focus();
  }
}

function setStatus(on) {
  onButton.classList.toggle('is-info', on);
  offButton.classList.toggle('is-info', !on);
  browser.storage.sync.set({ on }, function () {
    if (browser.runtime.lastError) showErrorMessage('Failed to save the status.');
  });
}

function restoreSettings() {
  browser.storage.sync.get({ on: true, rules: [] }, function (items) {
    if (browser.runtime.lastError) {
      showErrorMessage('Failed to retrieve your current settings.');
    } else {
      setStatus(items.on);
      rules = items.rules;

      var tbody = document.querySelector('tbody');
      while (tbody.rows.length > 1) {
        tbody.deleteRow(1);
      }

      defaultRules.forEach(rule => prependRuletoTable(rule, true));

      rules.forEach(rule => prependRuletoTable(rule, false));
    }
  });
}

document.addEventListener('DOMContentLoaded', restoreSettings);
onButton.addEventListener('click', () => setStatus(true));
offButton.addEventListener('click', () => setStatus(false));
document.querySelector('#add-rule').addEventListener('click', addRuleFromUI);

document.querySelectorAll('input').forEach(input => {
  input.onkeypress = function (e) {
    if (e.keyCode === 13) addRuleFromUI();
  };
});

document.querySelector('#export').addEventListener('click', () => {
  var data = new Blob([JSON.stringify({ rules })], { type: 'text/json;charset=utf-8' });
  var url = URL.createObjectURL(data);
  browser.downloads.download({ url, filename: 'betblocker-rules.json', saveAs: true });
});

document.querySelector('#import').addEventListener('click', function () {
  document.querySelector('#filepicker').click();
});

document.querySelector('#filepicker').addEventListener('change', function (e) {
  if (e.target.files.length) {
    var reader = new FileReader();
    reader.onload = function (readerEvent) {
      try {
        var json = JSON.parse(readerEvent.target.result);
        if (Array.isArray(json.rules)) {
          json.rules.reverse().forEach(rule => {
            if (rule.domain) addRule(rule.domain, rule.path || '');
          });
        }
      } catch (err) {
        showErrorMessage('Arquivo inválido.');
      }
    };
    reader.readAsText(e.target.files[0]);
  }
});