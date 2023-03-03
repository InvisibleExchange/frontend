import { BigNumber } from "ethers"

export type EIP712Domain = {
  name: string
  version: string
  chainId: string
  verifyingContract: string
}

export type EIP712Type = {
  Order: { name: string; type: string }[]
}

export type ZZToken = {
  address: string
  symbol: string
  decimals: number
  name: string
}

export type ZZMarket = {
  baseToken: string
  quoteToken: string
  verified: boolean
}

// export type TokenBalanceObject = Record<string, { value: BigNumber; valueReadable: number } | undefined>
// export type TokenAllowanceObject = Record<string, BigNumber | undefined>
export type TokenPriceObject = Record<string, number | undefined>
