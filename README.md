# EnergyShark Frontend - Entrega 2 (E2)

Cliente web (SPA) desarrollado con React, TypeScript y Vite para el monitoreo y administración autónoma del nodo de ciudad en el mercado energético P2P.

## Vistas Implementadas (E2)

- **/cycles (RF01):** Historial auditable de ciclos de 20 minutos. Muestra oferta propia publicada, bids de compra/venta, swaps ejecutados en wallet, cargos de transporte y liquidación final por desbalance (`imbalance-settlement`).
- **/market (RF02):** Mercado en vivo con cálculo dinámico de precio efectivo (precio base + costo de transporte por distancia) y detección visual de rutas caídas/penalizadas.
- **/control (RF04):** Panel de administración en caliente (`/market-strategy`) para ajustar `sellPriceMultiplier`, `maxBuyEffectivePriceRatio` y `spanSeconds` sin redeploy.
- **/audit (RF05):** Auditoría de anomalías, duplicados (`idpk`), mensajes descartados y NACKs (`IDENTITY_MISMATCH`).
- **/experiments (RF06):** Métricas agregadas y desglose histórico del experimento de span de espera frente al baseline de penalización de la central ($3 \times \text{imbalancePrice}$).

## Link página
[energy_shark_TK3](https://app.sofiaguerrero.me/)
