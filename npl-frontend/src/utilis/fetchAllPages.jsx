import axiosInstance from './axiosInstance'

export async function fetchAllPages(url) {
  let nextUrl = url
  const items = []

  while (nextUrl) {
    const response = await axiosInstance.get(nextUrl)
    const data = response.data
    const pageItems = data.results || data
    items.push(...pageItems)
    nextUrl = data.next
  }

  return items
}