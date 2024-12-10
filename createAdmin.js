import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const AdminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const Admin = mongoose.model('Admin', AdminSchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    
    const admin = new Admin({
      username: process.env.ADMIN_USERNAME,
      password: hashedPassword
    });

    await admin.save();
    console.log('Admin user created successfully');
    process.exit();
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });