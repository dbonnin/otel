/*app.ts*/
import express, { Express, Request, Response } from 'express';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const PORT: number = parseInt(process.env.PORT || '8080');
const TABLE_NAME: string = process.env.DYNAMODB_TABLE_NAME || 'express-app-table';
const AWS_REGION: string = process.env.AWS_REGION || 'us-east-1';

const app: Express = express();

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

app.get('/rolldice', async (req: Request, res: Response) => {
  try {
    const roll = getRandomNumber(1, 6);
    const timestamp = new Date().toISOString();
    
    // Write to DynamoDB
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        id: randomUUID(),
        roll: roll,
        timestamp: timestamp
      }
    }));
    
    res.send(roll.toString());
  } catch (error) {
    console.error('Error writing to DynamoDB:', error);
    res.status(500).send('Error saving roll');
  }
});

app.get('/rolls', async (req: Request, res: Response) => {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME
    }));
    
    res.json({
      count: result.Count || 0,
      rolls: result.Items || []
    });
  } catch (error) {
    console.error('Error reading from DynamoDB:', error);
    res.status(500).send('Error retrieving rolls');
  }
});

app.listen(PORT, () => {
  console.log(`Listening for requests on http://localhost:${PORT}`);
});