# TODO - Ajuste /adf/gift-codes

- [x] Analisar o arquivo `src/pages/AdminGiftCode.tsx` e identificar por que o link da foto não aparece.
- [x] Tornar o campo "Link da Foto" visível no formulário de criação.
- [x] Garantir que o payload continue consistente para envio de `imageUrl`.
- [x] Validar build/lint.
- [x] Realizar commit e push das alterações.

# TODO - Atualização de resgates em tempo real / limite atingido

- [x] Analisar a listagem "Códigos no Banco" em `src/pages/AdminGiftCode.tsx`.
- [ ] Exibir destaque visual de "Limite atingido" quando `usedCount >= maxUses`.
- [ ] Exibir contador de resgates por código em tempo real.
- [ ] Implementar atualização automática periódica dos dados (polling).
- [ ] Validar build/lint.
- [ ] Realizar commit e push das alterações.

# TODO - Admin Entradas de Pagamentos

- [x] Levantar arquivos e rotas relevantes no frontend e backend.
- [ ] Criar endpoint backend para listar depósitos (pagos e pendentes).
- [ ] Criar página frontend admin para visualizar entradas de pagamentos.
- [ ] Adicionar rota `/adf/deposits` no App.
- [ ] Adicionar categoria/botão no AdminSidebar para a nova página.
- [ ] Validar build frontend e backend.
- [ ] Realizar commit e push das alterações.
