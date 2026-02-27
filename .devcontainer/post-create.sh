#!/bin/zsh

echo "🚀 Début de la configuration post-création..."

#########################################

echo "#1. Configuration ZSH"
ZSH_CUSTOM_PLUGINS="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins"
install_plugin() {
    local name=$1
    local url=$2
    if [ ! -d "$ZSH_CUSTOM_PLUGINS/$name" ]; then
        git clone --depth 1 "$url" "$ZSH_CUSTOM_PLUGINS/$name"
    fi
}
install_plugin "zsh-autosuggestions" "https://github.com/zsh-users/zsh-autosuggestions"
install_plugin "zsh-syntax-highlighting" "https://github.com/zsh-users/zsh-syntax-highlighting.git"
if grep -q "plugins=(git)" ~/.zshrc; then
    sed -i 's/plugins=(git)/plugins=(git docker node zsh-autosuggestions zsh-syntax-highlighting)/' ~/.zshrc
fi

#########################################

echo "#2. Installation PNPM"
PNPM_VERSION=$(node -e "try { console.log(require('./package.json').packageManager.split('@')[1]) } catch(e) { console.log('latest') }")
if ! command -v pnpm &> /dev/null || [ "$(pnpm -v)" != "$PNPM_VERSION" ]; then
    npm install -g "pnpm@$PNPM_VERSION"
fi
if ! grep -q "pnpm completion" ~/.zshrc; then
    pnpm completion zsh >> ~/.zshrc
fi

#########################################

echo "#3. Installation de bun"
curl -fsSL https://bun.com/install | bash 

#########################################

echo "#4. Installation des deps"
pnpm install

#########################################

echo "#5. Ajout des commandes historiques pour ZSH"
echo ": $(date +%s):0;docker-compose -f docker-compose.resources.yml up --build" >> "$HOME/.zsh_history"

#########################################

echo "✨ Configuration terminée ! Relance ton terminal (ou tape 'source ~/.zshrc')."
