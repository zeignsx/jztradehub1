import express from 'express';
const app = express();
const PORT = 5000;

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server working!' });
});

app.post('/api/initialize-payment', (req, res) => {
  console.log('Payment endpoint called');
  res.json({ 
    success: true, 
    data: { 
      checkout_url: 'http://localhost:8083/payment-success?test=true' 
    } 
  });
});

app.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`✅ TEST SERVER RUNNING on http://localhost:${PORT}`);
  console.log(`📍 Test health: http://localhost:${PORT}/api/health`);
  console.log(`=================================\n`);
});