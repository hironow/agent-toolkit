import Stripe from 'stripe';
import {createCustomer, listCustomers} from './customers/functions';
import {createProduct, listProducts} from './products/functions';
import {createPrice, listPrices} from './prices/functions';
import {createPaymentLink} from './paymentLinks/functions';
import {
  createInvoice,
  listInvoices,
  finalizeInvoice,
} from '@/shared/invoices/functions';
import {createInvoiceItem} from '@/shared/invoiceItems/functions';
import {retrieveBalance} from '@/shared/balance/functions';
import {createRefund} from '@/shared/refunds/functions';
import {searchDocumentation} from '@/shared/documentation/functions';
import {listPaymentIntents} from '@/shared/paymentIntents/functions';
import {
  listSubscriptions,
  cancelSubscription,
  updateSubscription,
} from '@/shared/subscriptions/functions';

import type {Context} from './configuration';
import {createCoupon, listCoupons} from './coupons/functions';
import tools, {Tool} from './tools';

const TOOLKIT_HEADER = 'stripe-agent-toolkit-typescript';
const MCP_HEADER = 'stripe-mcp';

class StripeAPI {
  stripe: Stripe;

  context: Context;

  tools: Tool[];

  constructor(secretKey: string, context?: Context) {
    const stripeClient = new Stripe(secretKey, {
      appInfo: {
        name:
          context?.mode === 'modelcontextprotocol'
            ? MCP_HEADER
            : TOOLKIT_HEADER,
        version: '0.6.0',
        url: 'https://github.com/stripe/agent-toolkit',
      },
    });
    this.stripe = stripeClient;
    this.context = context || {};
    this.tools = tools(this.context);
  }

  async createMeterEvent({
    event,
    customer,
    value,
  }: {
    event: string;
    customer: string;
    value: string;
  }) {
    await this.stripe.billing.meterEvents.create(
      {
        event_name: event,
        payload: {
          stripe_customer_id: customer,
          value: value,
        },
      },
      this.context.account ? {stripeAccount: this.context.account} : undefined
    );
  }

  async run(method: string, arg: any) {
    const tool = this.tools.find((t) => t.method === method);
    if (tool) {
      const output = JSON.stringify(
        await tool.execute(this.stripe, this.context, arg)
      );
      return output;
    } else {
      throw new Error('Invalid method ' + method);
    }
  }
}

export default StripeAPI;
