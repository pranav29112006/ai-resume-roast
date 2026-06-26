import prisma from '../../lib/db';
import { roastResume } from '../../lib/claude';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js default body parser to handle file streams & manual JSON parsing
  },
};

// Helper to read raw JSON body when request is JSON
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Promise-based formidable parse wrapper
function parseForm(req) {
  const form = new IncomingForm({
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB limit
  });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    let resumeText = '';
    let fileName = 'Pasted Resume';

    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const { fields, files } = await parseForm(req);
      
      const resumeFile = files.resume;
      const file = Array.isArray(resumeFile) ? resumeFile[0] : resumeFile;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded. Please upload a PDF file.' });
      }

      fileName = file.originalFilename || 'Uploaded Resume';
      
      // Verify file is a PDF
      if (file.mimetype !== 'application/pdf' && !fileName.toLowerCase().endsWith('.pdf')) {
        return res.status(400).json({ error: 'Only PDF files are supported for upload.' });
      }

      // Read file and parse content
      const fileBuffer = fs.readFileSync(file.filepath);
      const pdfData = await pdf(fileBuffer);
      resumeText = pdfData.text || '';

      // Clean up the temporary file safely
      try {
        fs.unlinkSync(file.filepath);
      } catch (unlinkErr) {
        console.error('Error removing temp file:', unlinkErr);
      }
    } else {
      // Handle standard JSON payload
      const rawBody = await getRawBody(req);
      let body = {};
      try {
        body = JSON.parse(rawBody);
      } catch (parseErr) {
        return res.status(400).json({ error: 'Invalid JSON body.' });
      }

      resumeText = body.resume || '';
    }

    const trimmedLength = resumeText.trim().length;
    if (!resumeText || trimmedLength < 200) {
      return res.status(400).json({ 
        error: `Resume text is too short. It must be at least 200 characters. Current length: ${trimmedLength} characters.` 
      });
    }

    if (trimmedLength > 15000) {
      return res.status(400).json({ 
        error: 'Resume text is too long. Please restrict it to 15,000 characters.' 
      });
    }

    // Call the AI roasting logic
    const roast = await roastResume(resumeText);

    // Generate consistent score based on resume text
    let hash = 0;
    for (let i = 0; i < resumeText.length; i++) {
      hash = ((hash << 5) - hash) + resumeText.charCodeAt(i);
      hash |= 0;
    }
    const score = (Math.abs(hash) % 31) + 20; // Generate a score between 20 and 50

    // Save to database via Prisma (non-blocking for UI)
    try {
      await prisma.resumeRoast.create({
        data: {
          fileName: fileName,
          roast: roast,
          score: score,
          improvements: JSON.stringify(['Improve formatting', 'Reduce buzzwords', 'Add quantifiable metrics']),
          parsedText: resumeText.substring(0, 5000) // Keep preview of text
        }
      });
    } catch (dbError) {
      console.error('Prisma DB Log Error (Non-blocking):', dbError);
    }

    return res.status(200).json({ roast, score });
  } catch (error) {
    console.error('AI Roast Error:', error);
    return res.status(500).json({ error: 'Failed to process resume roast. Check your API key and model availability.' });
  }
}

