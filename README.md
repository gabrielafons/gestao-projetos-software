# Evently - Gestão de Eventos Corporativos

# Integrantes:
Gabriel Afonso dos Santos (Dev)<br>
Giovane Contreras Oba (PO)<br>
Gustavo Trovó Ramos de Souza (SM)<br>
Igor de Araujo Borges (Dev)<br>

# Descrição do Projeto: 
O Evently é uma plataforma web para gestão de eventos corporativos realizados por convite, sem venda de ingressos. A empresa organizadora emite convites nominais e, no momento em que o convidado confirma presença, o sistema libera automaticamente uma trilha de material preparatório sobre os temas do evento, além de um guia com todas as informações operacionais. Essa trilha inclui uma aula preparatória, que aborda os temas que serão tratados no evento. Durante o evento o convidado terá acesso a um quiz relacionado ao que foi apresentado, e ao atingir nota mínima, garante o direito a um brinde. O brinde é entregue em algum balcão a partir da leitura do código de acesso único de cada participante. No dia, a entrada e a saída são registradas por leitura desse código, permitindo apurar presença efetiva. Desistências podem ser formalizadas e o convite transferido a um substituto, evitando vagas ociosas.

# Definition of Done — Sprint 1

Uma história só é considerada **Finalizada** quando, para cada camada decomposta nas tarefas dela:

## 1. Dados
- Atributos da entidade implementados exatamente como definidos no refinamento (ex: Organizador, Evento, Convidado, etc.)
- Relacionamentos entre entidades implementados quando aplicável (ex: Convite vinculado a Evento e a Convidado, Convidado vinculado ao Convite recebido)

## 2. Back-end
- Endpoint implementado e respondendo conforme o contrato definido no refinamento (rota, payload, status codes)
- Validações de dados obrigatórios implementadas no servidor (nunca só no front)
- Regras de negócio específicas da história implementadas (ex: verificação de convite expirado no UH02/UH05, controle de acesso por perfil no UH04)

## 3. Front-end
- Tela/formulário implementado conforme o fluxo esperado
- Validação client-side implementada quando prevista na história
- Feedback visual de erro e sucesso para o usuário

## 4. Integração
- Front-end consumindo o endpoint real (não mock) e tratando os retornos de sucesso e erro

## 5. Teste
- Cenário de fluxo válido testado e passando (o "caminho feliz")
- Cenário de fluxo inválido/alternativo testado e passando (dados ausentes, convite expirado, credenciais inválidas, etc. — conforme a história)

## 6. Critérios de aceite
- Os 2 critérios de aceite definidos no refinamento (fluxo esperado + alternativo) foram verificados e confirmados por alguém além de quem desenvolveu

## 7. Geral / Sprint
- Sem bugs conhecidos de severidade alta em aberto
- Merge feito na branch principal de integração sem quebrar o que já estava funcionando
- Card movido e documentado no Trello com evidência (print, link do PR, etc.)
- Itens validados devidamente pelo PO, seguindo a disponibilidade das funcionalidades propostas
