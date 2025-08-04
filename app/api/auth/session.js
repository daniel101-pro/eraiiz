import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await client.connect();
    const db = client.db('eraiiz');
    const user = await db.collection('users').findOne({ email: decoded.email });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    return res.status(200).json({ email: user.email, role: user.role });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(401).json({ message: 'Invalid session' });
  } finally {
    await client.close();
  }
}