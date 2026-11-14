const http = require('node:http');

let sequence = 0;
const payments = new Map();

const server = http.createServer((request, response) => {
  const send = (status, body) => {
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(JSON.stringify(body));
  };
  if (request.url === '/health') return send(200, { status: 'ok' });
  if (request.method === 'POST' && request.url === '/v1/payments') {
    const id = `mock-payment-${++sequence}`;
    payments.set(id, { id, status: 'approved' });
    return send(201, {
      id,
      status: 'approved',
      point_of_interaction: {
        transaction_data: { ticket_url: `http://mercado-pago-mock/pay/${id}` },
      },
    });
  }
  const payment = request.url?.match(/^\/v1\/payments\/([^/]+)$/);
  if (request.method === 'GET' && payment) {
    return send(200, payments.get(payment[1]) ?? { id: payment[1], status: 'approved' });
  }
  const refund = request.url?.match(/^\/v1\/payments\/([^/]+)\/refunds$/);
  if (request.method === 'POST' && refund) {
    return send(201, { id: `refund-${refund[1]}`, status: 'approved' });
  }
  return send(404, { error: 'not found' });
});

server.listen(3000, '0.0.0.0');
