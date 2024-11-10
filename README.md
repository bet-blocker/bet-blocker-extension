# BetBlocker Extension

<p align="center">
  <img src="https://github.com/user-attachments/assets/381fc157-e750-4a9f-b89d-28c840beedad" alt="screen-home" width="1200">
</p>

[![Star on GitHub](https://img.shields.io/github/stars/bet-blocker/bet-blocker-extension.svg?style=social)](https://github.com/bet-blocker/bet-blocker-extension/stargazers)
<a href="https://github.com/bet-blocker/bet-blocker-extension/network" target="_blank"><img alt="GitHub forks" src="https://img.shields.io/github/forks/bet-blocker/bet-blocker-extension"></a>
<a href="https://github.com/bet-blocker/bet-blocker-extension/issues" target="_blank"><img alt="GitHub issues" src="https://img.shields.io/github/issues/bet-blocker/bet-blocker-extension"></a>
[![GitHub tag](https://img.shields.io/github/tag/bet-blocker/bet-blocker-extension)](https://github.com/bet-blocker/bet-blocker-extension/releases/?include_prereleases&sort=semver "View GitHub releases")
[![License](https://img.shields.io/badge/License-MIT-blue)](#license "Go to license section")

Esta extensão para Google Chrome utiliza a Bet Blocker API para bloquear automaticamente o acesso a domínios listados pela API. Além disso, permite que o usuário adicione domínios manualmente na página de configurações.
Quando a extensão está ativada, o bloqueio ocorre automaticamente. Caso haja algum problema ao buscar os domínios na API, a extensão conta com um arquivo `blocked.json`, que atua como uma lista de fallback, garantindo que alguns domínios permaneçam bloqueados mesmo em caso de erro.

# Lista atual
```txt
https://raw.githubusercontent.com/bet-blocker/bet-blocker/main/blocklist.txt
```

## Instalação e Uso

Para usar a extensão no Chrome, siga os passos abaixo:

1. Abra o Chrome.
2. Digite `chrome://extensions` na barra de endereços.
3. Ative o **Modo de Desenvolvedor** no canto superior direito da página.
4. Clique em **Carregar sem pacote**.
5. Selecione a pasta da extensão.

Após a instalação, a extensão estará ativa e começará a bloquear automaticamente os domínios listados pela API. 

## Configurações

Na página de configurações da extensão, você pode:

- Visualizar os domínios bloqueados automaticamente pela API.
- Adicionar domínios manualmente à lista de bloqueio.

## Prints

## Extensão
![image](https://github.com/user-attachments/assets/1f737756-6a84-484b-94ee-9e542949b23a)

## Configurações da Extensão
![image](https://github.com/user-attachments/assets/f000908f-ad8c-4ad2-807a-329a650f4da4)
