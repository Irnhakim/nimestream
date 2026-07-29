// Simple in-memory storage for active sessions
// Maps session IDs/hashes to timestamps
const activeSessions = new Map();

// Cleanup stale sessions (older than 45 seconds)
function cleanupSessions() {
  const now = Date.now();
  for (const [id, timestamp] of activeSessions.entries()) {
    if (now - timestamp > 45000) {
      activeSessions.delete(id);
    }
  }
}

export async function GET(request) {
  cleanupSessions();
  
  // Return count (minimum 1 user representing current client request)
  const count = Math.max(1, activeSessions.size);
  return Response.json({ online: count });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = body.id || 'anonymous';
    
    // Update or add active session timestamp
    activeSessions.set(sessionId, Date.now());
    
    cleanupSessions();
    
    const count = Math.max(1, activeSessions.size);
    return Response.json({ online: count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
