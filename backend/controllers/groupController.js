// controllers/groupController.js
import Group from '../models/Group.js';
import User from '../models/User.js';
import streamClient from '../config/stream.js';

// Create a new group
export async function createGroup(req, res) {
  try {
    const { name, description, members } = req.body;
    
    if (!name || !members || !members.length) {
      return res.status(400).json({ message: "Group name and at least one member are required" });
    }
    
    // Add the current user as admin and a member
    const adminId = req.user.id;
    const allMembers = [...new Set([...members, adminId])]; // Ensure unique members
    
    // Create a unique channelId for Stream
    const channelId = `group-${Date.now()}`;
    
    // Create the channel in Stream with required creator information
    const channel = streamClient.channel('messaging', channelId, {
      name,
      members: allMembers.map(id => id.toString()),
      created_by_id: adminId.toString(), // Required for server-side auth
      image: req.body.avatar || null,
      description: description || null,
      // Add group flag to make identification easier
      isGroup: true
    });
    
    // This creates the channel properly with server permissions
    await channel.create();
    console.log(`Group channel created: ${channelId}`);
    
    // Then create the group in your database
    const newGroup = await Group.create({
      name,
      description,
      admin: adminId,
      members: allMembers,
      channelId
    });
    
    // Add this group to each member's groups array
    await User.updateMany(
      { _id: { $in: allMembers } },
      { $addToSet: { groups: newGroup._id } }
    );
    
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Failed to create group: " + error.message });
  }
}

// Get all groups the user is a member of
export async function getUserGroups(req, res) {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).populate('groups');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(user.groups);
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ message: "Failed to fetch groups" });
  }
}

// Get a single group by ID
export async function getGroupById(req, res) {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findById(groupId)
      .populate('members', 'username avatar _id')
      .populate('admin', 'username avatar _id');
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    // Check if the user is a member of this group
    if (!group.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(403).json({ message: "You're not a member of this group" });
    }
    
    res.status(200).json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ message: "Failed to fetch group" });
  }
}

// Add a member to a group
export async function addGroupMember(req, res) {
  try {
    const { groupId, userId } = req.body;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    // Check if the current user is the admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the group admin can add members" });
    }
    
    // Check if the user to be added exists
    const userToAdd = await User.findById(userId);
    
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Add user to group if not already a member
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
      
      // Add group to user's groups
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { groups: groupId } }
      );
      
      // Add user to Stream channel
      const channel = streamClient.channel('messaging', group.channelId);
      await channel.addMembers([userId.toString()]);
    }
    
    res.status(200).json({ message: "Member added successfully" });
  } catch (error) {
    console.error("Error adding group member:", error);
    res.status(500).json({ message: "Failed to add member" });
  }
}

// Remove a member from a group
export async function removeGroupMember(req, res) {
  try {
    const { groupId, userId } = req.body;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    // Check if the current user is the admin or the user themselves
    if (group.admin.toString() !== req.user.id && req.user.id !== userId) {
      return res.status(403).json({ message: "You don't have permission to remove this member" });
    }
    
    // Remove user from group
    group.members = group.members.filter(
      memberId => memberId.toString() !== userId
    );
    await group.save();
    
    // Remove group from user's groups
    await User.findByIdAndUpdate(
      userId,
      { $pull: { groups: groupId } }
    );
    
    // Remove user from Stream channel
    const channel = streamClient.channel('messaging', group.channelId);
    await channel.removeMembers([userId.toString()]);
    
    res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing group member:", error);
    res.status(500).json({ message: "Failed to remove member" });
  }
}

// Delete a group
export async function deleteGroup(req, res) {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    // Check if the current user is the admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the group admin can delete the group" });
    }
    
    // Remove group from all members' groups array
    await User.updateMany(
      { _id: { $in: group.members } },
      { $pull: { groups: groupId } }
    );
    
    // Delete the channel in Stream
    const channel = streamClient.channel('messaging', group.channelId);
    await channel.delete();
    
    // Delete the group from database
    await Group.findByIdAndDelete(groupId);
    
    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: "Failed to delete group" });
  }
}