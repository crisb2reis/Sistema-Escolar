# Guia de Debug - Erro ao Escanear QR Code

## Como Ver os Logs

### 1. No Terminal (onde você executou `npm start`)
- Os logs aparecerão automaticamente quando você escanear o QR code
- Procure por mensagens que começam com:
  - `QR Code escaneado`
  - `Token extraído`
  - `Enviando token`
  - `Erro na requisição`

### 2. No App (Expo Go)
- **Android**: Agite o celular → "Show Element Inspector" ou "Debug Remote JS"
- **iOS**: Agite o celular → "Debug Remote JS"
- Os logs aparecerão no console do navegador (se estiver usando debug remoto)

### 3. Usando React Native Debugger
- Instale: `npm install -g react-native-debugger`
- Execute: `react-native-debugger`
- Conecte o app ao debugger

## Problemas Comuns e Soluções

### Erro: "Something went wrong"
**Causa**: Erro de JavaScript não tratado

**Solução**:
1. Verifique os logs no terminal
2. Procure por erros de sintaxe ou imports faltando
3. Recarregue o app: agite o celular → "Reload"

### Erro: "Network Error" ou "Connection refused"
**Causa**: Não consegue conectar ao backend

**Solução**:
1. Verifique se o backend está rodando: `http://192.168.15.9:9080/docs`
2. Verifique se o IP está correto em `src/services/api.ts`
3. Certifique-se de que celular e computador estão na mesma Wi-Fi
4. Verifique o firewall (porta 9080 deve estar aberta)

### Erro: "Token inválido" ou "Invalid QR token"
**Causa**: Token expirado ou inválido

**Solução**:
1. Gere um novo QR code na tela do professor
2. Verifique se o QR code não foi usado antes (tokens são únicos)
3. Verifique se o QR code não expirou (geralmente expira em 10 minutos)

### Erro: "Student does not belong to this class"
**Causa**: Aluno não está na turma da sessão

**Solução**:
1. Verifique se o aluno está matriculado na turma correta
2. Verifique se a sessão foi criada para a turma correta

### Erro: "Attendance already registered"
**Causa**: Presença já foi registrada

**Solução**:
- Este não é um erro, apenas informa que você já fez check-in

## Teste Passo a Passo

1. **Teste de Conexão**:
   ```bash
   # No celular, abra o navegador e acesse:
   http://192.168.15.9:9080/docs
   ```
   Se abrir a documentação do Swagger, a conexão está OK.

2. **Teste de Login**:
   - Faça login no app
   - Se funcionar, a API está acessível

3. **Teste do QR Code**:
   - Gere um novo QR code na tela do professor
   - Escaneie imediatamente (antes de expirar)
   - Verifique os logs no terminal

## Informações para Reportar o Erro

Se o erro persistir, colete estas informações:

1. **Logs do terminal** (copie e cole)
2. **Mensagem de erro exata** no app
3. **Momento do erro**:
   - Ao escanear?
   - Ao processar?
   - Ao enviar para API?
4. **Status do backend**: Está rodando?
5. **Status da rede**: Celular e PC na mesma Wi-Fi?

## Comandos Úteis

```bash
# Limpar cache do Expo
npm start -- --clear

# Ver logs detalhados
npm start -- --verbose

# Recarregar app
# Pressione 'r' no terminal ou agite o celular → "Reload"
```

