import { EicTransactionsAndOrdersDto } from '../eic-scraper.dto'

export const csvOrderToOrdersDto = (
  parsedOrders: Record<string, string>[],
): Pick<EicTransactionsAndOrdersDto, 'orders'> => ({
  orders: parsedOrders
    .filter((order) => order['Druh pokynu'] !== 'Konverzia')
    .map((order) => ({
      currency: order['Mám'],
      amount: order['Počet'],
      fond: order.Chcem,
      isin: order.ISIN,
      date: new Date(order['Dátum']),
    })),
})
