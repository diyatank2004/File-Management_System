import mongoose from 'mongoose';
import dotenv from 'dotenv';
import File from './models/File.js';

dotenv.config();

const query = 'LOGICAL'; // From our previous check

async function testSearch() {
    await mongoose.connect(process.env.MONGO_URI);
    const regex = new RegExp(query, 'i');
    
    // Test 1: Simple regex find
    const results = await File.find({ content: regex });
    console.log(`Regex Results for "${query}":`, results.length);
    
    // Test 2: Text index find
    const textResults = await File.find({ $text: { $search: query } });
    console.log(`Text Index Results for "${query}":`, textResults.length);
    
    await mongoose.disconnect();
}

testSearch();
