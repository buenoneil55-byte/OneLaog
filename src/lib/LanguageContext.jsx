import React, { createContext, useContext, useState } from 'react'

const translations = {
  en: {
    'home.brand': 'ONE LAOG',
    'home.greeting': 'Hi',
    'home.subtitle': 'What would you like to buy today?',
    'home.search': 'Search vegetables, meat...',
    'home.popular': 'Popular Products',
    'home.seeAll': 'See all',
    'home.noProducts': 'No products available',
    'home.addedToCart': 'Added to cart',
    'cart.title': 'Order Details',
    'cart.myCart': 'My Cart',
    'cart.empty': 'Your cart is empty',
    'cart.deliveryAddress': 'Delivery Address',
    'cart.required': 'Required',
    'cart.paymentMethod': 'Payment Method',
    'cart.cod': 'Cash on Delivery',
    'cart.gcash': 'GCash',
    'cart.card': 'Credit/Debit Card',
    'cart.orderInfo': 'Order Info',
    'cart.subtotal': 'Sub Total',
    'cart.delivery': 'Delivery',
    'cart.tax': 'Tax',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.placing': 'Placing order...',
    'cart.enterAddress': 'Enter delivery address to continue',
    'orders.title': 'Orders',
    'orders.noActive': 'No active orders',
    'orders.cancelled': 'Order cancelled',
    'orders.cancelDesc': 'Your order has been cancelled',
    'orders.cancel': 'Cancel Order',
    'orders.cancelling': 'Cancelling...',
    'orders.moreItems': 'more items',
    'history.title': 'History',
    'history.empty': 'No order history yet',
    'history.rate': 'Rate',
    'category.all': 'All Products'
  },
  fil: {
    'home.brand': 'ONE LAOG',
    'home.greeting': 'Kamusta',
    'home.subtitle': 'Anong gusto mong bilhin ngayon?',
    'home.search': 'Maghanap ng gulay, karne...',
    'home.popular': 'Sikat na Produkto',
    'home.seeAll': 'Lahat',
    'home.noProducts': 'Walang available na produkto',
    'home.addedToCart': 'Idinagdag sa cart',
    'cart.title': 'Order Details',
    'cart.myCart': 'Aking Cart',
    'cart.empty': 'Walang laman ang cart',
    'cart.deliveryAddress': 'Delivery Address',
    'cart.required': 'Kailangan',
    'cart.paymentMethod': 'Paraan ng Bayad',
    'cart.cod': 'Cash on Delivery',
    'cart.gcash': 'GCash',
    'cart.card': 'Credit/Debit Card',
    'cart.orderInfo': 'Order Info',
    'cart.subtotal': 'Sub Total',
    'cart.delivery': 'Delivery',
    'cart.tax': 'Tax',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.placing': 'Nagpapabilang...',
    'cart.enterAddress': 'Ilagay ang delivery address',
    'orders.title': 'Mga Order',
    'orders.noActive': 'Walang aktibong order',
    'orders.cancelled': 'Nakansela ang order',
    'orders.cancelDesc': 'Nakansela na ang order',
    'orders.cancel': 'Kanselahin',
    'orders.cancelling': 'Kinakansela...',
    'orders.moreItems': 'pa',
    'history.title': 'History',
    'history.empty': 'Wala pang order history',
    'history.rate': 'Rate',
    'category.all': 'Lahat ng Produkto'
  }
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en')
  const t = (key) => translations[lang][key] || key
  const toggle = () => {
    const next = lang === 'en' ? 'fil' : 'en'
    setLang(next)
    localStorage.setItem('lang', next)
  }
  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)