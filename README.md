# FinanceAI - Gestão Financeira

Aplicação web estática para controle financeiro local. O sistema permite cadastrar receitas e despesas, filtrar transações, visualizar resumo financeiro, acompanhar calendário, exportar relatórios e manter backup dos dados.

## Como Usar

Abra o arquivo `index.html` diretamente no navegador.

Não é necessário instalar dependências, rodar servidor ou configurar banco de dados. Os dados ficam salvos no `localStorage` do navegador.

## Recursos

- Cadastro, edição e exclusão de transações.
- Seleção e exclusão em massa.
- Filtros por período, busca, tipo, categoria e forma de pagamento.
- Resumo de receitas, despesas, saldo e taxa de economia.
- Resumo histórico por hoje, ontem, semana passada e mês passado.
- Estatísticas por forma de pagamento.
- Calendário financeiro com transações por dia.
- Gráfico de despesas por categoria.
- Exportação para JSON, Excel, CSV e PDF.
- Importação de JSON, Excel e CSV.
- Proteção contra fechamento com backup pendente.

## Backup e Fechamento Seguro

Quando houver alterações sem exportação, o topo do app mostra `Backup pendente`.

Se tentar fechar ou recarregar a página nesse estado, o navegador exibirá um aviso nativo de confirmação. Para liberar o fechamento com segurança, use uma das opções:

- `Backup JSON`
- `Excel`
- `CSV`
- `PDF`

Depois de exportar, o status muda para `Pronto para fechar`.

Observação: navegadores modernos não permitem bloquear totalmente o fechamento da aba. A proteção possível é exibir a confirmação nativa antes de fechar ou recarregar.

## Estrutura

- `index.html`: estrutura da interface.
- `styles.css`: design visual, layout responsivo e estados da UI.
- `script.js`: regras de negócio, filtros, armazenamento local, importação/exportação, calendário e gráficos.

## Dependências Via CDN

O projeto usa bibliotecas externas carregadas por CDN:

- Bulma CSS
- Font Awesome
- Chart.js
- SheetJS/XLSX
- jsPDF

## Cuidados

- Limpar os dados do navegador pode apagar as transações.
- Trocar de navegador ou computador não leva os dados junto automaticamente.
- Faça backup JSON regularmente para preservar as informações.
- Arquivos importados precisam ter dados válidos de data, descrição, valor, tipo e categoria.

