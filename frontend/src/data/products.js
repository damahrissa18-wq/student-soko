export const products = [
  {
    id: 'campus-classic-hoodie',
    name: 'Campus Classic Hoodie',
    category: 'Hoodies',
    price: 2500,
    oldPrice: 3200,
    image: '/images/hoodie.jpg',
    badge: 'Best seller',
    colors: ['#121212', '#d9f56b', '#efe3cf'],
  },
  {
    id: 'soko-heavy-tee',
    name: 'Soko Heavy Tee',
    category: 'Tees',
    price: 1200,
    oldPrice: null,
    image: '/images/white-tee.jpg',
    badge: 'New',
    colors: ['#f5f1e8', '#121212', '#ff4d1c'],
  },
  {
    id: 'night-class-cap',
    name: 'Night Class Cap',
    category: 'Caps',
    price: 900,
    oldPrice: 1100,
    image: '/images/cap.jpg',
    badge: null,
    colors: ['#121212', '#efe3cf', '#d9f56b'],
  },
  {
    id: 'lecture-hall-tote',
    name: 'Lecture Hall Tote',
    category: 'Bags',
    price: 1100,
    oldPrice: null,
    image: '/images/tote.jpg',
    badge: null,
    colors: ['#efe3cf', '#121212'],
  },
  {
    id: 'oversized-crew-hoodie',
    name: 'Oversized Crew Hoodie',
    category: 'Hoodies',
    price: 2800,
    oldPrice: 3400,
    image: '/images/hoodie-alt.jpg',
    badge: 'Low stock',
    colors: ['#121212', '#716a62'],
  },
  {
    id: 'campus-fit-tee',
    name: 'Campus Fit Tee',
    category: 'Tees',
    price: 1300,
    oldPrice: null,
    image: '/images/tee-model.jpg',
    badge: null,
    colors: ['#f5f1e8', '#121212'],
  },
]

export const categories = [
  {
    name: 'Hoodies',
    count: '12 styles',
    image: '/images/hoodie.jpg',
    className: 'col-span-2 min-h-[280px] lg:col-span-2 lg:row-span-2 lg:min-h-0',
  },
  {
    name: 'Tees',
    count: '18 styles',
    image: '/images/tees.jpg',
    className: 'min-h-[180px] lg:min-h-0',
  },
  {
    name: 'Caps',
    count: '9 styles',
    image: '/images/cap.jpg',
    className: 'min-h-[180px] lg:min-h-0',
  },
  {
    name: 'Bags & totes',
    count: '6 styles',
    image: '/images/tote.jpg',
    className: 'min-h-[180px] lg:min-h-0',
  },
  {
    name: 'Fresh fits',
    count: 'Shop the look',
    image: '/images/tee-model.jpg',
    className: 'min-h-[180px] lg:min-h-0',
  },
]

export const filters = ['All', 'Hoodies', 'Tees', 'Caps', 'Bags']

export const formatPrice = (value) => `KSh ${value.toLocaleString('en-KE')}`
