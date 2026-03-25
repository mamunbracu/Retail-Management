import appPromise from '../server.ts';
// API Entry Point for Vercel - v1.0.5

export default async function handler(req: any, res: any) {
  console.log(`Vercel API request: ${req.method} ${req.url}`);
  
  // Simple health check for Vercel to verify API is alive
  if (req.url === '/api/health-check') {
    return res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV, vercel: !!process.env.VERCEL });
  }

  try {
    const app = await appPromise;
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel API Error:", error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
