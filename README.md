# 🎱 LottoPool Master

> **Sistema Completo para Gestão de Bolões de Loteria**

O **LottoPool Master** é uma aplicação web moderna desenvolvida para facilitar a organização, gestão e acompanhamento de bolões de loteria. Com uma interface intuitiva e recursos avançados, o sistema permite que administradores e participantes tenham total transparência e controle sobre jogos, pagamentos e premiações.

---

## ✨ Funcionalidades Principais

### 👥 Para Participantes
- **Dashboard Personalizado**: Visão geral dos seus bolões ativos e saldo.
- **Meus Bolões**: Acompanhamento detalhado dos jogos que você está participando.
- **Transparência**: Visualização de comprovantes digitalizados (volantes) para conferência.
- **Convites**: Sistema fácil para entrar em novos grupos via link de convite.

### 🛡️ Para Administradores
- **Gestão de Grupos**: Criação e administração de múltiplos grupos de apostas.
- **Gestão Financeira**: Controle de pagamentos, saldos e rateio de prêmios.
- **Gestão de Participantes**: Controle de acesso e permissões de usuários.
- **Registro de Jogos**: Cadastro de apostas e upload de comprovantes.
- **Inteligência Artificial**: Integração com Google GenAI para insights (em desenvolvimento).

---

## 🚀 Tecnologias Utilizadas

O projeto foi construído utilizando as tecnologias mais modernas do ecossistema React:

- **Frontend**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Backend / Database**: [PocketBase](https://pocketbase.io/)
- **AI Integration**: Google GenAI SDK

---

## 🛠️ Instalação e Execução

Siga os passos abaixo para rodar o projeto localmente:

### Pré-requisitos
- Node.js (versão 18 ou superior recomendada)
- NPM ou Yarn

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/lottopool-master.git
   cd lottopool-master
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**
   Abra seu navegador e acesse `http://localhost:5173` (ou a porta indicada no terminal).

---

## 📂 Estrutura do Projeto

```
lottopool2/
├── components/          # Componentes React da aplicação
│   ├── Auth.tsx         # Sistema de Autenticação
│   ├── Dashboard.tsx    # Painel Principal
│   ├── Layout.tsx       # Estrutura base das páginas
│   └── ...
├── services/            # Serviços de integração (API, DB)
│   ├── db.ts            # Configuração do PocketBase
│   └── geminiService.ts # Serviço de IA
├── types.ts             # Definições de tipos TypeScript
├── App.tsx              # Componente Raiz e Roteamento
├── index.html           # Ponto de entrada HTML
└── vite.config.ts       # Configuração do Vite
```

---

## 📝 Configuração

### Variáveis de Ambiente
Para funcionalidades avançadas (como integração com IA e Banco de Dados em produção), pode ser necessário configurar variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto seguindo o padrão (se aplicável).

### Backend (PocketBase)
O projeto espera uma instância do PocketBase rodando. Certifique-se de configurar a URL de conexão corretamente em `services/db.ts` caso não esteja usando a configuração padrão.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

---

Developed with ❤️ using React & Vite
