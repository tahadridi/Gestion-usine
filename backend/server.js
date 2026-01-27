import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import cookieParser from "cookie-parser";
import carGroupRoutes from './routes/CarRoutes.js';
import productRoutes from './routes/productRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import notificationRoutes from './routes/NotificationRoutes.js';
import batchRoutes from './routes/Batch.js'; 
import productionLineRoutes from './routes/productionLines.js';
import authRoutes from "./routes/AuthRoute.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import analyticsRoutes from './routes/analyticsRoutes.js';
import activitiesRoutes from './routes/activityRoutes.js';
import reclamationRoutes from './routes/reclamationRoutes.js';

import { Server } from 'socket.io';

dotenv.config();
const app = express();
const server = http.createServer(app); // Create HTTP server

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// Make io accessible to routes
app.set('io', io);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000", //  React app
  credentials: true, // ✅ allow cookies
}));

app.use(express.json());
app.use(cookieParser());
app.get('/api/test', (req, res) => {
  res.json({ message: "API is working!" });
});

// Routes - MAKE SURE batchRoutes IS MOUNTED CORRECTLY
app.use('/api/car-groups', carGroupRoutes);
app.use('/api/products', productRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/batches', batchRoutes); 
app.use('/api/production-lines', productionLineRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/reclamations', reclamationRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  
  // Join a room for specific batch updates
  socket.on('joinBatchRoom', (batchId) => {
    socket.join(batchId);
    console.log(`Socket ${socket.id} joined batch room ${batchId}`);
  });
  
  // Leave a batch room
  socket.on('leaveBatchRoom', (batchId) => {
    socket.leave(batchId);
    console.log(`Socket ${socket.id} left batch room ${batchId}`);
  });
  
socket.on("disconnect", (reason) => {
  console.log("Disconnected:",socket.id, reason);
});

});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carparts')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 8080;

// Use server.listen (not app.listen) for Socket.IO
server.listen(PORT, () => console.log('🚀 Server running on port ' + PORT));