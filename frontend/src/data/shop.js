export const FREE_DELIVERY_AT = 2000
export const DELIVERY_FEE = 150

export function getDeliveryFee(subtotal) {
  return subtotal >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE
}
