import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

async function createPrice() {
  try {
    // List existing products
    const products = await stripe.products.list({ limit: 5 });
    console.log('Existing products:', products.data.map(p => ({ id: p.id, name: p.name })));

    // Use first product or create new one
    let productId = products.data[0]?.id;
    
    if (!productId) {
      console.log('\n📦 Creating new product...');
      const product = await stripe.products.create({
        name: 'FileHop Premium',
        description: 'Unlimited storage and priority support',
      });
      productId = product.id;
      console.log('✅ Created product:', productId);
    } else {
      console.log('✅ Using existing product:', productId);
    }

    // Create monthly price
    console.log('\n💰 Creating monthly price...');
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: 399, // $3.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      billing_scheme: 'per_unit',
    });

    console.log('\n✅ Price created successfully!');
    console.log('Price ID:', price.id);
    console.log('\nAdd this to your .env:');
    console.log(`STRIPE_SUBSCRIPTION_PRICE_ID=${price.id}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

createPrice();
