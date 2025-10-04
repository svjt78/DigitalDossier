// pages/api/revalidate.js
// On-demand revalidation API for updating static pages when votes/comments change

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for secret to confirm this is a valid request
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.REVALIDATION_TOKEN || 'dev-token-secure-123';
  
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== expectedToken) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const { paths } = req.body;

    if (!paths || !Array.isArray(paths)) {
      return res.status(400).json({ error: 'Paths array is required' });
    }

    // Revalidate all specified paths
    const revalidationPromises = paths.map(async (path) => {
      try {
        await res.revalidate(path);
        return { path, success: true };
      } catch (error) {
        console.error(`Failed to revalidate ${path}:`, error);
        return { path, success: false, error: error.message };
      }
    });

    const results = await Promise.all(revalidationPromises);
    
    console.log('Revalidation results:', results);

    return res.json({ 
      message: 'Revalidation completed',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return res.status(500).json({ 
      error: 'Failed to revalidate',
      details: error.message 
    });
  }
}
