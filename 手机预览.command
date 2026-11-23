#!/bin/zsh
cd -- "${0:A:h}"
if ! command -v node >/dev/null 2>&1 && [[ -f "$HOME/.nvm/nvm.sh" ]]; then
  source "$HOME/.nvm/nvm.sh"
fi
if ! command -v npm >/dev/null 2>&1; then
  print '请先安装 Node.js，再启动手机预览。'
  read 'reply?按回车关闭…'
  exit 1
fi
npm run preview
if [[ $? -ne 0 ]]; then
  read 'reply?启动失败，按回车关闭…'
fi
