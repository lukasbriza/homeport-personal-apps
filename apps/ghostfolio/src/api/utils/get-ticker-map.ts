import { HttpException, HttpStatus } from '@nestjs/common'

import { EicOrdersDto, EicTransactionDto, FondDefinitionDto } from '../../scrapers/eic'

export const getTickerMap = (transactions: EicTransactionDto[], orders: EicOrdersDto[]) => {
  const fondIsinMap = new Map<string, string>()
  const tickerMap = new Map<string, FondDefinitionDto>()

  for (const order of orders) {
    if (fondIsinMap.get(order.fond) === undefined) {
      fondIsinMap.set(order.fond, order.isin)
    }
  }

  for (const transaction of transactions) {
    if (!tickerMap.has(transaction.fond)) {
      const isin = fondIsinMap.get(transaction.fond)

      if (isin === undefined) {
        throw new HttpException(
          `Isin and name cannot be find for fond ${transaction.fond}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      } else {
        tickerMap.set(transaction.fond, {
          fond: transaction.fond,
          isin,
          currency: transaction.currency,
        })
      }
    }
  }

  return tickerMap
}
