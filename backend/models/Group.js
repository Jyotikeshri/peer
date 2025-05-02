// models/Group.js
import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  avatar: { 
    type: String 
  },
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }],
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  // Store the Stream channel ID for this group
  channelId: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);

export default Group;