import bcrypt from 'bcryptjs';
import { dbRequest } from '../config/db.js';

export const registerUser = async (email, password, role = 'operator') => {
  const hash = await bcrypt.hash(password, 10);
  const user = await dbRequest(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role`,
    [email, hash, role]
  );
  return user[0];
};

export const loginUser = async (email, password) => {
  const users = await dbRequest(`SELECT * FROM users WHERE email = $1`, [email]);
  if (!users.length) return null;
  
  const user = users[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;
  
  return { id: user.id, email: user.email, role: user.role };
};

export const registerDrone = async (serialNumber, model, ownerId, manufacturer) => {
  const drone = await dbRequest(
    `INSERT INTO drones (serial_number, model, owner_id, manufacturer, status) 
     VALUES ($1, $2, $3, $4, 'REGISTERED') RETURNING *`,
    [serialNumber, model, ownerId, manufacturer]
  );
  return drone[0];
};

export const getDronesByOwner = async (ownerId) => {
  return await dbRequest(`SELECT * FROM drones WHERE owner_id = $1`, [ownerId]);
};

export const getAllDrones = async () => {
  return await dbRequest(`SELECT * FROM drones`);
};
