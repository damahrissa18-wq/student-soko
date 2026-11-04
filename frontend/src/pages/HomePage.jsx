import Hero from '../components/Hero'
import Marquee from '../components/Marquee'
import Categories from '../components/Categories'
import FeaturedProducts from '../components/FeaturedProducts'
import Perks from '../components/Perks'
import Testimonials from '../components/Testimonials'
import DropSignup from '../components/DropSignup'
import Seo from '../components/Seo'
import { absoluteUrl, siteConfig } from '../config/site'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'StudentSoko',
  description:
    'Campus streetwear, bags, notebooks and travel gear designed and delivered in Nairobi.',
  url: absoluteUrl('/'),
  email: siteConfig.email,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Nairobi',
    addressCountry: 'KE',
  },
  sameAs: siteConfig.socials.map((social) => social.href),
}

export default function HomePage({
  onQuickAdd,
  getStock,
  lowStockThreshold,
}) {
  return (
    <>
      <Seo
        title="StudentSoko — Campus drip, delivered"
        description="Hoodies, tees, bags, notebooks and travel gear made for student life. Free campus delivery in Nairobi on orders over KSh 2,000. Pay with M-Pesa."
        path="/"
        jsonLd={jsonLd}
      />
      <main>
        <Hero onQuickAdd={onQuickAdd} />
        <Marquee />
        <Categories />
        <FeaturedProducts
          onQuickAdd={onQuickAdd}
          getStock={getStock}
          lowStockThreshold={lowStockThreshold}
        />
        <Perks />
        <Testimonials />
        <DropSignup />
      </main>
    </>
  )
}
