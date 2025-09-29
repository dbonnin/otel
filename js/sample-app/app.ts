/*app.ts*/
import express, { Express, Request, Response, NextFunction } from 'express';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { metrics } from '@opentelemetry/api';

const PORT: number = parseInt(process.env.PORT || '8080');
const TABLE_NAME: string = process.env.DYNAMODB_TABLE_NAME || 'express-app-table';
const AWS_REGION: string = process.env.AWS_REGION || 'us-east-1';

console.log('🚀 Initializing Express application...');
console.log(`📋 Configuration:`);
console.log(`   - PORT: ${PORT}`);
console.log(`   - TABLE_NAME: ${TABLE_NAME}`);
console.log(`   - AWS_REGION: ${AWS_REGION}`);

const app: Express = express();

// Initialize DynamoDB client
console.log('🔧 Initializing DynamoDB client...');
let client: DynamoDBClient;
let docClient: DynamoDBDocumentClient;

try {
  client = new DynamoDBClient({ region: AWS_REGION });
  docClient = DynamoDBDocumentClient.from(client);
  console.log('✅ DynamoDB client initialized successfully');
} catch (error) {
  console.error('❌ Error initializing DynamoDB client:', error);
  process.exit(1);
}

// Initialize OpenTelemetry meter for custom metrics
console.log('📊 Initializing OpenTelemetry metrics...');
const meter = metrics.getMeter('express-app');
const requestDurationHistogram = meter.createHistogram('http.server.request.duration', {
  description: 'Duration of HTTP requests in milliseconds',
  unit: 'ms'
});
console.log('✅ OpenTelemetry metrics initialized successfully');

// Middleware to track request duration and send custom metrics
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    
    console.log(`📈 Recording custom metric:`);
    console.log(`   - Method: ${req.method}`);
    console.log(`   - URL: ${req.url}`);
    console.log(`   - Route: ${req.route?.path || req.path}`);
    console.log(`   - Status: ${res.statusCode}`);
    console.log(`   - Duration: ${duration}ms`);
    console.log(`   - Timestamp: ${timestamp}`);
    
    // Record custom metric with attributes
    requestDurationHistogram.record(duration, {
      'http.method': req.method,
      'http.route': req.route?.path || req.path,
      'http.status_code': res.statusCode,
      'http.url': req.url,
      'timestamp': timestamp
    });
    
    console.log('✅ Custom metric recorded successfully');
  });
  
  next();
});

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

app.get('/rolldice', async (req: Request, res: Response) => {
  console.log('🎲 /rolldice endpoint called');
  
  try {
    // Step 1: Generate random number
    console.log('   📊 Step 1: Generating random dice roll...');
    const roll = getRandomNumber(1, 6);
    console.log(`   ✅ Generated roll: ${roll}`);
    
    // Step 2: Create timestamp
    console.log('   ⏰ Step 2: Creating timestamp...');
    const timestamp = new Date().toISOString();
    console.log(`   ✅ Timestamp created: ${timestamp}`);
    
    // Step 3: Generate unique ID
    console.log('   🔑 Step 3: Generating unique ID...');
    const id = randomUUID();
    console.log(`   ✅ ID generated: ${id}`);
    
    // Step 4: Prepare DynamoDB item
    const item = {
      id: id,
      roll: roll,
      timestamp: timestamp
    };
    console.log('   📦 Step 4: Prepared item for DynamoDB:', JSON.stringify(item));
    
    // Step 5: Write to DynamoDB
    console.log('   💾 Step 5: Writing to DynamoDB...');
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));
    console.log('   ✅ Successfully saved to DynamoDB');
    
    // Step 6: Send response
    console.log('   📤 Step 6: Sending response to client');
    res.send(roll.toString());
    console.log(`   ✅ Response sent successfully: ${roll}`);
    
  } catch (error) {
    console.error('❌ Error in /rolldice endpoint:');
    console.error('   🔍 Error details:', error);
    console.error('   📍 Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.name === 'ValidationException') {
        console.error('   🚫 DynamoDB validation error - check table schema');
        res.status(400).send('Invalid data format');
      } else if (error.name === 'ResourceNotFoundException') {
        console.error('   🚫 DynamoDB table not found');
        res.status(503).send('Database table not available');
      } else if (error.name === 'UnknownEndpoint') {
        console.error('   🚫 DynamoDB endpoint not reachable');
        res.status(503).send('Database service unavailable');
      } else {
        console.error('   🚫 Unexpected error occurred');
        res.status(500).send('Error saving roll');
      }
    } else {
      console.error('   🚫 Non-standard error occurred');
      res.status(500).send('Error saving roll');
    }
  }
});

app.get('/rolls', async (req: Request, res: Response) => {
  console.log('📋 /rolls endpoint called');
  
  try {
    // Step 1: Prepare scan command
    console.log('   🔍 Step 1: Preparing DynamoDB scan command...');
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME
    });
    console.log(`   ✅ Scan command prepared for table: ${TABLE_NAME}`);
    
    // Step 2: Execute scan
    console.log('   💾 Step 2: Executing DynamoDB scan...');
    const result = await docClient.send(scanCommand);
    console.log('   ✅ Scan completed successfully');
    
    // Step 3: Process results
    console.log('   📊 Step 3: Processing scan results...');
    const count = result.Count || 0;
    const items = result.Items || [];
    console.log(`   ✅ Found ${count} items`);
    
    // Step 4: Prepare response
    console.log('   📦 Step 4: Preparing response object...');
    const response = {
      count: count,
      rolls: items
    };
    console.log('   ✅ Response object prepared:', JSON.stringify({ count, itemsLength: items.length }));
    
    // Step 5: Send response
    console.log('   📤 Step 5: Sending response to client');
    res.json(response);
    console.log(`   ✅ Response sent successfully with ${count} items`);
    
  } catch (error) {
    console.error('❌ Error in /rolls endpoint:');
    console.error('   🔍 Error details:', error);
    console.error('   📍 Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.name === 'ResourceNotFoundException') {
        console.error('   🚫 DynamoDB table not found');
        res.status(503).send('Database table not available');
      } else if (error.name === 'UnknownEndpoint') {
        console.error('   🚫 DynamoDB endpoint not reachable');
        res.status(503).send('Database service unavailable');
      } else if (error.name === 'AccessDeniedException') {
        console.error('   🚫 Access denied to DynamoDB');
        res.status(403).send('Database access denied');
      } else {
        console.error('   🚫 Unexpected error occurred');
        res.status(500).send('Error retrieving rolls');
      }
    } else {
      console.error('   🚫 Non-standard error occurred');
      res.status(500).send('Error retrieving rolls');
    }
  }
});

// Start the server with error handling
console.log('🚀 Starting Express server...');
try {
  const server = app.listen(PORT, () => {
    console.log('✅ Server started successfully!');
    console.log(`🌐 Listening for requests on http://localhost:${PORT}`);
    console.log('📡 Available endpoints:');
    console.log('   - GET /rolldice - Roll a dice and save to DynamoDB');
    console.log('   - GET /rolls - Retrieve all dice rolls from DynamoDB');
  });
  
  // Handle server errors
  server.on('error', (error: Error) => {
    console.error('❌ Server error occurred:');
    console.error('   🔍 Error details:', error);
    if (error.message.includes('EADDRINUSE')) {
      console.error(`   🚫 Port ${PORT} is already in use`);
      console.error('   💡 Try using a different port or stop the existing process');
    }
    process.exit(1);
  });
  
  // Graceful shutdown handling
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  });
  
} catch (error) {
  console.error('❌ Failed to start server:');
  console.error('   🔍 Error details:', error);
  process.exit(1);
}