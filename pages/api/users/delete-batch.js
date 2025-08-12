// pages/api/users/delete-batch.js
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { emails } = req.body;

  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: 'No users selected for deletion' });
  }

  console.log('Delete batch API called with emails:', emails);

  // Get credential service URL and token from environment
  const AUTH_BASE = process.env.AUTH_API_BASE || 'http://credential-app:8001';
  const INTERNAL_TOKEN = process.env.CREDENTIAL_INTERNAL_TOKEN;
  
  console.log('Auth configuration:', {
    AUTH_BASE,
    hasToken: !!INTERNAL_TOKEN,
    tokenLength: INTERNAL_TOKEN ? INTERNAL_TOKEN.length : 0
  });

  if (!INTERNAL_TOKEN) {
    console.error('Missing CREDENTIAL_INTERNAL_TOKEN in environment');
    return res.status(500).json({ error: 'Server configuration error: Missing internal token' });
  }

  // Use dynamic import for node-fetch (ESM module)
  let fetch;
  try {
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default;
    console.log('Using node-fetch for HTTP requests');
  } catch (err) {
    console.error('Failed to import node-fetch:', err);
    // Fallback to global fetch if available (Node 18+)
    if (global.fetch) {
      fetch = global.fetch;
      console.log('Using global fetch');
    } else {
      return res.status(500).json({ error: 'Server configuration error: fetch not available' });
    }
  }

  let deletedCount = 0;
  const errors = [];
  const deletedEmails = [];

  try {
    // First, get user details from blog DB
    const blogUsers = await prisma.user.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`Found ${blogUsers.length} users in blog database`);

    // Delete users one by one for proper synchronization
    for (const user of blogUsers) {
      try {
        console.log(`Processing deletion for user: ${user.email}`);
        
        // Step 1: Try to delete from credential service first (optional - continue if fails)
        let credentialDeleted = false;
        
        try {
          // Attempt to get user info from credential service
          const getUserUrl = `${AUTH_BASE}/auth/users/by-email/${encodeURIComponent(user.email)}`;
          console.log(`Fetching user from credential service: ${getUserUrl}`);
          
          const credentialUserRes = await fetch(getUserUrl, {
            method: 'GET',
            headers: {
              'X-Service-Token': INTERNAL_TOKEN,
              'Content-Type': 'application/json',
            },
          });

          console.log(`Credential service response status: ${credentialUserRes.status}`);

          if (credentialUserRes.ok) {
            const credentialUser = await credentialUserRes.json();
            console.log(`Found credential user with ID: ${credentialUser.user_id}`);
            
            // Now delete from credential service using the user_id
            const deleteUrl = `${AUTH_BASE}/auth/users/${credentialUser.user_id}`;
            console.log(`Deleting from credential service: ${deleteUrl}`);
            
            const deleteRes = await fetch(deleteUrl, {
              method: 'DELETE',
              headers: {
                'X-Service-Token': INTERNAL_TOKEN,
              },
            });

            if (deleteRes.ok) {
              console.log(`Successfully deleted ${user.email} from credential service`);
              credentialDeleted = true;
            } else {
              const errorText = await deleteRes.text();
              console.error(`Failed to delete from credential service: ${errorText}`);
            }
          } else if (credentialUserRes.status === 404) {
            console.log(`User ${user.email} not found in credential service, proceeding with blog deletion`);
            credentialDeleted = true; // Mark as "deleted" since it doesn't exist
          } else {
            const errorText = await credentialUserRes.text();
            console.error(`Error fetching user from credential service: ${errorText}`);
          }
        } catch (credErr) {
          console.error(`Credential service error for ${user.email}:`, credErr);
          console.error('Error details:', credErr.message, credErr.stack);
          // Continue with blog deletion even if credential service fails
        }

        // Step 2: Delete from blog database
        try {
          await prisma.user.delete({
            where: {
              id: user.id,
            },
          });
          
          console.log(`Successfully deleted ${user.email} from blog database`);
          deletedCount++;
          deletedEmails.push(user.email);
        } catch (blogErr) {
          console.error(`Failed to delete ${user.email} from blog database:`, blogErr);
          errors.push(`Failed to delete ${user.email} from blog database`);
        }
        
      } catch (err) {
        console.error(`Unexpected error deleting user ${user.email}:`, err);
        errors.push(`Error deleting ${user.email}: ${err.message}`);
      }
    }

    // Handle users that don't exist in blog DB
    const notFoundEmails = emails.filter(email => !blogUsers.find(u => u.email === email));
    if (notFoundEmails.length > 0) {
      console.log(`Users not found in blog database: ${notFoundEmails.join(', ')}`);
      errors.push(`Users not found: ${notFoundEmails.join(', ')}`);
    }

    // Return appropriate response
    if (deletedCount === 0 && errors.length > 0) {
      return res.status(400).json({
        deleted: 0,
        total: emails.length,
        error: errors.join('; '),
      });
    }

    if (errors.length > 0) {
      return res.status(207).json({
        deleted: deletedCount,
        total: emails.length,
        deletedEmails,
        errors,
        message: `Deleted ${deletedCount} of ${emails.length} users. Some operations failed.`,
      });
    }

    return res.status(200).json({
      deleted: deletedCount,
      total: emails.length,
      deletedEmails,
      message: `Successfully deleted ${deletedCount} user${deletedCount !== 1 ? 's' : ''}`,
    });
    
  } catch (error) {
    console.error('Batch delete error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to delete users', 
      details: error.message 
    });
  }
}