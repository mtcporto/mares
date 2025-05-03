# Sistema de Visualização de Marés

## Descrição

Este é um sistema web para visualização de dados de marés, fornecendo informações precisas sobre os horários e níveis de marés para diferentes localizações costeiras. O projeto inclui visualizações interativas, gráficos de marés e informações detalhadas sobre as marés altas e baixas.

## Funcionalidades

- Visualização gráfica interativa das marés ao longo do dia
- Exibição das marés altas e baixas com horários precisos
- Indicação da maré atual e próxima maré
- Tabela com previsão de marés para os próximos 5 dias
- Integração com informações de fase lunar
- Design responsivo para diferentes dispositivos

## Tecnologias Utilizadas

### Frontend
- **HTML5/CSS3** - Estruturação e estilização das páginas
- **JavaScript** - Lógica de interação e manipulação de dados
- **Bootstrap 4** - Framework CSS para layout responsivo
- **D3.js** - Biblioteca para visualização de dados e criação de gráficos interativos
- **Luxon** - Biblioteca para manipulação de datas e horas
- **jQuery** - Simplificação de manipulação DOM e requisições AJAX

### Bibliotecas Específicas
- **VisTideChart** - Componente personalizado para visualização de gráficos de marés
- **VisTooltip** - Componente para exibição de tooltips interativos
- **Tide-Predictor** - Biblioteca para cálculos de predição de marés
- **Weather Icons** - Conjunto de ícones meteorológicos e astronômicos
- **Material Design Icons** - Conjunto de ícones para interface

### APIs
- **Farmsense Moon Phase API** - Obtenção de informações sobre fases lunares

## Estrutura do Projeto

- `index.html` - Página principal com visualização completa
- `mares.html` - Tabela de marés com seleção de localização
- `graf.html` - Página focada na visualização gráfica
- `vis-tc.js` - Implementação do componente VisTideChart
- `vis-tc.css` - Estilos para o componente de gráfico
- `vis-tooltip.js` - Implementação do componente de tooltip
- `vis-tooltip.css` - Estilos para o componente de tooltip

## Como Usar

1. Abra o arquivo `index.html` em um navegador web
2. Visualize os dados de marés do dia atual no gráfico interativo
3. Consulte a tabela para informações sobre marés dos próximos dias
4. Em `mares.html`, selecione diferentes localizações para visualizar dados específicos

## Requisitos

- Navegador web moderno com suporte a JavaScript ES6
- Conexão com internet para carregar bibliotecas externas e APIs