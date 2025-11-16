# Sistema de Frequência Escolar - Mobile App

App React Native para alunos fazerem check-in via QR Code.

## Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Expo CLI instalado globalmente: `npm install -g expo-cli`
- **Expo Go** instalado no seu celular:
  - [Android - Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)

## Instalação

1. Entre no diretório do mobile:
```bash
cd mobile
```

2. Instale as dependências:
```bash
npm install
```

3. Configure a URL da API no arquivo `src/services/api.ts`:
```typescript
// Altere a URL para o IP do seu servidor backend
const API_BASE_URL = 'http://SEU_IP:9080/api/v1';
// Exemplo: 'http://192.168.15.9:9080/api/v1'
// Porta padrão: 9080 (altere se necessário)
```

**Importante**: Use o IP da sua máquina na rede local, não `localhost`, pois o celular precisa acessar o backend pela rede.

## Como Executar

### Método 1: Usando Expo Go (Recomendado para desenvolvimento)

1. Inicie o servidor Expo:
```bash
npm start
```

2. Você verá um QR code no terminal e no navegador.

3. **No seu celular:**
   - **Android**: Abra o app **Expo Go** e toque em "Scan QR Code", ou use a câmera do celular para escanear o QR code
   - **iOS**: Abra o app **Câmera** nativa e escaneie o QR code (o Expo Go abrirá automaticamente)

4. O app será carregado no seu celular.

### Método 2: Executar em emulador/simulador

**Android:**
```bash
npm run android
```
(Requer Android Studio e um emulador configurado)

**iOS:**
```bash
npm run ios
```
(Requer Xcode e um simulador configurado - apenas macOS)

**Web:**
```bash
npm run web
```
(Abre no navegador)

## Como Usar o App

### 1. Login

- Abra o app no celular
- Faça login com suas credenciais de aluno (matrícula e senha)

### 2. Fazer Check-in via QR Code

1. Na tela inicial, toque em "Escanear QR Code"
2. Permita o acesso à câmera quando solicitado
3. Aponte a câmera para o QR code exibido na tela do professor
4. O app processará automaticamente e registrará sua presença
5. Você verá uma mensagem de sucesso

### 3. Ver Histórico

- Acesse a opção "Histórico" no menu
- Veja todas as suas presenças registradas

## Comandos Úteis do Expo

Quando o servidor estiver rodando (`npm start`), você pode usar:

- **`a`** - Abrir no Android (emulador)
- **`i`** - Abrir no iOS (simulador)
- **`w`** - Abrir no navegador web
- **`r`** - Recarregar o app
- **`m`** - Abrir menu de desenvolvedor
- **`j`** - Abrir debugger
- **`Ctrl+C`** - Parar o servidor

## Solução de Problemas

### Erro: "Unable to resolve module"

Execute:
```bash
npm install
npm start -- --clear
```

### App não conecta ao backend

1. Verifique se o backend está rodando
2. Verifique se o IP no `src/services/api.ts` está correto
3. Certifique-se de que o celular e o computador estão na mesma rede Wi-Fi
4. Verifique se o firewall não está bloqueando a porta 9080 (ou a porta que você configurou)

### QR Code não abre o app

- Certifique-se de que o **Expo Go** está instalado
- No Android, use o app Expo Go para escanear
- No iOS, use a câmera nativa

### Avisos de versão de pacotes

Se aparecer avisos sobre versões de pacotes (como mostrado no exemplo), você pode atualizar:

```bash
npm install react-native@0.73.6
npm install expo-camera@~14.1.3
# etc...
```

Ou simplesmente ignorar se o app estiver funcionando corretamente.

### Erro de permissão de câmera

- Android: Vá em Configurações > Apps > Expo Go > Permissões > Câmera
- iOS: Vá em Configurações > Expo Go > Câmera

### Erro "Something went wrong" ao escanear QR Code

Se você ver a tela de erro "Something went wrong" ao escanear o QR code:

1. **Verifique os logs no terminal:**
   - No terminal onde você executou `npm start`, procure por mensagens de erro
   - Os logs mostrarão o que está causando o problema

2. **Verifique os logs no app:**
   - No Expo Go, agite o celular para abrir o menu de desenvolvedor
   - Toque em "Show Element Inspector" ou "Debug Remote JS"
   - Os logs aparecerão no console do navegador (se estiver usando debug remoto)

3. **Problemas comuns:**
   - **URL da API incorreta**: Verifique se `src/services/api.ts` tem o IP correto
   - **Backend não está rodando**: Certifique-se de que o backend está ativo
   - **Token inválido**: O QR code pode ter expirado, gere um novo
   - **Rede diferente**: Celular e computador devem estar na mesma Wi-Fi

4. **Teste manual:**
   - Tente fazer login primeiro para verificar se a conexão com a API está funcionando
   - Se o login funcionar, o problema pode estar no processamento do QR code

5. **Recarregue o app:**
   - No Expo Go, agite o celular e toque em "Reload"
   - Ou pressione `r` no terminal onde o Expo está rodando

## Funcionalidades

- ✅ Login de alunos
- ✅ Scanner de QR Code para check-in
- ✅ Histórico de presenças
- ✅ Deep link automático ao escanear QR code
- ✅ Validação de token e sessão
- ✅ Feedback visual de sucesso/erro

## Estrutura do QR Code

O QR code gerado contém um deep link no formato:
```
frequenciaescolar://checkin?token=TOKEN_JWT
```

Quando escaneado:
- O app mobile abre automaticamente (se instalado)
- O token é extraído e enviado para o backend
- A presença é registrada automaticamente

## Desenvolvimento

Para desenvolvimento, recomenda-se usar o Expo Go para testes rápidos. Para produção, você precisará criar um build nativo usando:

```bash
expo build:android
expo build:ios
```

Ou usando EAS Build (recomendado):
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```



