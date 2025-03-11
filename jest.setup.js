import dotenv from 'dotenv';
import { jest } from '@jest/globals';

// Load environment variables
dotenv.config();

// Set up global mocks
global.jest = jest; 