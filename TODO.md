# TODO - Gift Codes / Gift Vouchers Flow

- [ ] Backend: ajustar `gift_codes` com campos de venda (is_listed_for_sale, image_url, sale_price, description, discount_coupon, discount_percent)
- [ ] Backend: atualizar `POST /api/admin/gift-codes` para receber/salvar dados de venda
- [ ] Backend: atualizar `GET /api/gift-vouchers` para listar códigos publicados para venda
- [ ] Backend: atualizar `POST /api/gift-vouchers/purchase` para usar código já criado no admin (sem geração automática)
- [ ] Frontend Admin: atualizar `AdminGiftCode.tsx` com opção “colocar à venda” e campos condicionais
- [ ] Frontend User: ajustar `GiftVouchers.tsx` para consumir nova vitrine e preço com desconto
- [ ] Frontend User: revisar `GiftVouchers.css` para consistência visual final
- [ ] Testes críticos do fluxo `/adf/gift-codes` -> `/gift-vouchers` -> `/profile`
- [ ] Commit + push backend
- [ ] Commit + push frontend
