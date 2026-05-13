import mongoose from 'mongoose';
import dotenv from 'dotenv';
import File from './models/File.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const file = await File.findOne().sort({ createdAt: -1 });
    console.log('--- LAST FILE CHECK ---');
    console.log('Filename:', file.filename);
    console.log('Content Length:', file.content?.length || 0);
    console.log('Content Snippet:', file.content?.slice(0, 100));
    await mongoose.disconnect();
}

check();
