import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

export class StripeService {
  static async createPaymentIntent(
    amount: number,
    email: string,
    description?: string
  ): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      receipt_email: email,
      description,
    });
  }

  static async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    return stripe.customers.create({
      email,
      name,
    });
  }

  static async createSubscription(customerId: string, priceId: string): Promise<Stripe.Subscription> {
    return stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
  }

  static async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  static async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return stripe.subscriptions.retrieve(subscriptionId);
  }

  static async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    return stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
    });
  }

  static async updateDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<Stripe.Customer> {
    return stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  static async retrievePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    return stripe.paymentMethods.retrieve(paymentMethodId);
  }

  static async retryInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    return stripe.invoices.pay(invoiceId, {
      paid_out_of_band: false,
    });
  }

  static async listFailedInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      status: 'open',
      limit: 100,
    });
    return invoices.data.filter(inv => inv.paid === false);
  }

  static constructWebhookEvent(body: Buffer, signature: string): Stripe.Event {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  }
}
