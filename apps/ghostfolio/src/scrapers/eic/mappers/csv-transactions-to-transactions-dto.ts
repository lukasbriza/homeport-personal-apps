import { EicTransactionsAndOrdersDto } from '../eic-scraper.dto'

export const csvTransactionsToTransactionDto = (
  parsedTransactions: Record<string, string>[],
): Pick<EicTransactionsAndOrdersDto, 'transactions'> => ({
  transactions: parsedTransactions
    .filter((transaction) => transaction['Druh pokynu'].length > 0)
    .map((transaction) => ({
      fond: transaction.Fond,
      type: transaction['Druh pokynu'] === 'Kúpa' ? 'BUY' : 'SELL',
      currency: transaction.Mena,
      amount: transaction['Počet'],
      price: transaction.Cena,
      volume: transaction.Objem,
      fee: transaction['Poplatok<br />za vykonanie'],
      date: transaction['Obchodný deň'],
      accounted: transaction.Stav === 'Zaúčtovaný',
    })),
})
