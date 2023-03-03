import { useEffect, useState } from "react"
import { ZZMarket } from "../../data/zzTypes"

export default function useFavoriteMarkets() {
  const [favorites, setFavorites] = useState<string[]>([])

  function getFavorites() {
    if (typeof window !== "undefined") {
      const storedFavorites = window.localStorage.getItem("favoriteMarkets")
      return storedFavorites ? (JSON.parse(storedFavorites) as string[]) : []
    }
    return []
  }

  function addFavorite(market: ZZMarket) {
    const { baseToken, quoteToken } = market
    const pair = `${baseToken}-${quoteToken}`
    const currentFavorites = getFavorites()
    if (currentFavorites.includes(pair)) return
    const newFavorites = [...currentFavorites, pair]
    window.localStorage.setItem("favoriteMarkets", JSON.stringify(newFavorites))
    setFavorites(getFavorites())
  }

  function removeFavorite(market: ZZMarket) {
    const { baseToken, quoteToken } = market
    const pair = `${baseToken}-${quoteToken}`
    const currentFavorites = getFavorites()
    // const index = currentFavorites.findIndex(v => v === pair)
    // if (index<0) return

    const newFavorites = currentFavorites.filter(v => v !== pair)
    window.localStorage.setItem("favoriteMarkets", JSON.stringify(newFavorites))
    setFavorites(getFavorites())
  }

  useEffect(() => {
    setFavorites(getFavorites())
  }, [window])

  return { favorites, addFavorite, removeFavorite }
}
