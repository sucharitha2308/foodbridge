const express = require('express');
const router = express.Router();
const { protect } = require('./authMiddleware.js');
const Donation = require('./Donation.js');
const User = require('./User.js');

// Get current user's info
router.get('/me', protect, (req, res) => {
    res.status(200).json(req.user);
});

// Submit a new food donation
router.post('/submit-donation', protect, async (req, res) => {
    const { foodName, quantity, photo, pickupAddress, location, deliveryMode } = req.body;
    
    try {
        const donation = new Donation({
            foodName,
            quantity,
            photo,
            pickupAddress,
            location,
            deliveryMode,
            donorId: req.user._id,
        });

        const createdDonation = await donation.save();
        res.status(201).json(createdDonation);
    } catch (error) {
        console.error("Donation submission error:", error);
        res.status(400).json({ message: 'Error submitting donation', error: error.message });
    }
});

// Get a user's donation history
router.get('/user-donations', protect, async (req, res) => {
    try {
        const donations = await Donation.find({ donorId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(donations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get all available donations for volunteers
router.get('/available-donations', protect, async (req, res) => {
    if (req.user.role !== 'volunteer') {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const donations = await Donation.find({ status: 'Available', deliveryMode: 'volunteer-collect' }).populate('donorId', 'name');
        res.status(200).json(donations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Volunteer accepts a donation
router.put('/accept-donation/:id', protect, async (req, res) => {
    if (req.user.role !== 'volunteer') {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const donation = await Donation.findById(req.params.id);
        if (donation && donation.status === 'Available') {
            donation.status = 'Pending Pickup';
            donation.volunteerId = req.user._id;
            const updatedDonation = await donation.save();
            res.status(200).json(updatedDonation);
        } else {
            res.status(404).json({ message: 'Donation not found or already accepted' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Volunteer marks a donation as completed
router.put('/complete-donation/:id', protect, async (req, res) => {
    if (req.user.role !== 'volunteer') {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const donation = await Donation.findById(req.params.id);
        if (donation && donation.volunteerId.equals(req.user._id)) {
            donation.status = 'Completed';
            const updatedDonation = await donation.save();
            res.status(200).json(updatedDonation);
        } else {
            res.status(404).json({ message: 'Donation not found or you are not assigned to it' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;