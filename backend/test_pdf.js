import pdf from 'pdf-parse';
import fs from 'fs';

// Try to find any PDF in the directory or a sample one
const pdfPath = './test.pdf'; // I'll assume there might be one or I'll check first

async function test() {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        console.log('PDF TEXT:', data.text);
    } catch (e) {
        console.error('PDF Error:', e);
    }
}

// I'll check for a pdf first
const files = fs.readdirSync('.');
const firstPdf = files.find(f => f.endsWith('.pdf'));
if (firstPdf) {
    console.log('Testing with:', firstPdf);
    const dataBuffer = fs.readFileSync(firstPdf);
    pdf(dataBuffer).then(data => {
        console.log('PDF TEXT LENGTH:', data.text.length);
        console.log('PDF SNIPPET:', data.text.slice(0, 100));
    });
} else {
    console.log('No PDF found to test.');
}
