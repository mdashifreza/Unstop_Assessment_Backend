const express = require('express');
const app = express();
require('dotenv').config();
//middleware
const bodyparser = require("body-parser");
const cors = require('cors');
app.use(cors());
app.use(bodyparser.json());
const router = express.Router();
//mmongodb---connect:
const mongoose = require("mongoose");
const dbPass = process.env.DB_PASS;
const uri = `mongodb+srv://ashifcse1723:${dbPass}@unstopbackend.jxsol3q.mongodb.net/?retryWrites=true&w=majority`;
mongoose.connect(uri)
    .then(() => {
        console.log("mongoose connection is established");
    })
    .catch((error) => {
        console.log("error while connectiing with mongodb cluster.", error)
    })
//model import :
const Seat = require("./models/Seat");
const initializeSeatsInMongoDB = async () => {
    try {
        // Check if in development environment
        for (let row = 1; row <= 10; row++) {
            const rowSeats = row === 10 ? 3 : 7;
            const numSeatsToReserve = Math.floor(Math.random() * rowSeats);

            const seats = [];
            for (let seatNumber = 1; seatNumber <= rowSeats; seatNumber++) {
                const isReserved = seatNumber <= numSeatsToReserve;
                seats.push({
                    seatNumber,
                    isReserved,
                });
            }

            const seatDocument = new Seat({
                row,
                seats,
            });

            await seatDocument.save();
        }
        console.log("Seats initialized in MongoDB.");
    } catch (error) {
        console.error("Error initializing seats in MongoDB:", error);
    }
};
initializeSeatsInMongoDB();
// reserve seats route
router.post("/reserve", async (req, res) => {
    try {
        const { numSeats } = req.body;
        const numSeatsRequested = numSeats;
        // console.log("checking seat", numSeats)
        const allSeats = await Seat.find();
        const seatsToReserve = await reserveSeats(numSeatsRequested, allSeats);

        res.json({ success: true, seats: seatsToReserve });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Error in reserving seats:" });
    }
});

// helper function to reserve seats
const reserveSeats = async (numSeatsRequested, allSeats) => {
    let seatsToReserve = [];

    // Iterate through each row
    for (let i = 0; i < allSeats.length; i++) {
        const currentRowSeats = allSeats[i].seats;
        const availableSeats = currentRowSeats.filter(seat => !seat.isReserved);

        //available seats in the current row
        if (numSeatsRequested <= availableSeats.length) {
            seatsToReserve = availableSeats.slice(0, numSeatsRequested);
            break;
        } else if (i < allSeats.length - 1) {
            // next row, when 1st row full
            const nextRowAvailableSeats = allSeats[i + 1].seats.filter(seat => !seat.isReserved);
            const remainingSeats = numSeatsRequested - seatsToReserve.length;

            if (remainingSeats <= nextRowAvailableSeats.length) {
                seatsToReserve = seatsToReserve.concat(nextRowAvailableSeats.slice(0, remainingSeats));
                break;
            } else {
                seatsToReserve = seatsToReserve.concat(nextRowAvailableSeats);
            }
        }
    }
    //reserved seats update
    let rowIdx;
    seatsToReserve.forEach(seat => {
        rowIdx = allSeats.findIndex(row => row.seats.includes(seat));
        const seatIdx = allSeats[rowIdx].seats.findIndex(s => s === seat);

        allSeats[rowIdx].seats[seatIdx].isReserved = true;
    });

    await Promise.all(allSeats.map(row => row.save()));

    return {seatsToReserve, rowIdx};
};

//get route
router.get("/seats", async (req, res) => {
    try {
        const seats = await Seat.find();
        res.json(seats);
    } catch (error) {
        res.status(500).json({ error: "Error in fetching seat Data:" })
    }
})
//server
app.use("/api", router);
const port = process.env.PORT || 8089;
app.listen(port, () => {
    console.log("server is running at port: ", port)
})
