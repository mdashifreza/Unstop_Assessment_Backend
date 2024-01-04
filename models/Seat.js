const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
    row: {
        type: Number,
        required: true,
    },
    seats: [{
        seatNumber: {
            type: Number,
            required: true,
        },
        isReserved: {
            type: Boolean,
            required: true,
        },
    }],
});

const Seat = mongoose.model('Seat', seatSchema);
module.exports = Seat;
